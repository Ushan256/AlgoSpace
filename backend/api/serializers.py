from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Document


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']
        extra_kwargs = {
            'email': {'required': False, 'allow_blank': True},
        }

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('A user with this username already exists.')
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = [
            'id',
            'user',
            'title',
            'content',
            'created_at',
            'updated_at',
            'time_complexity',
            'space_complexity',
            'justification',
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
