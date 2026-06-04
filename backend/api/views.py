from django.contrib.auth import authenticate
from rest_framework import status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .code_analyzer import analyze_python_code
from .models import Document
from .serializers import DocumentSerializer, UserSerializer

SYNTAX_ERROR_PAYLOAD = {
    'error': 'Syntax Error: Invalid Python structure or indentation detected.',
}


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = UserSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    user = serializer.save()
    token, _ = Token.objects.get_or_create(user=user)
    return Response(
        {
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
            },
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')

    if not username or not password:
        return Response(
            {'detail': 'Username and password are required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(username=username, password=password)
    if user is None:
        return Response(
            {'detail': 'Invalid credentials.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    token, _ = Token.objects.get_or_create(user=user)
    return Response(
        {
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
            },
        },
        status=status.HTTP_200_OK,
    )


class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Document.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze_code(request):
    code = request.data.get('code', '')
    if not isinstance(code, str) or not code.strip():
        return Response(
            {'detail': 'A non-empty code string is required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        result = analyze_python_code(code)
    except SyntaxError:
        return Response(SYNTAX_ERROR_PAYLOAD, status=status.HTTP_400_BAD_REQUEST)
    except ValueError as exc:
        if 'invalid syntax' in str(exc).lower() or 'indentation' in str(exc).lower():
            return Response(SYNTAX_ERROR_PAYLOAD, status=status.HTTP_400_BAD_REQUEST)
        return Response(
            {'error': str(exc)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(result, status=status.HTTP_200_OK)
