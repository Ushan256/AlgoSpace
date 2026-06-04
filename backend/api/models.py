import uuid

from django.contrib.auth.models import User
from django.db import models


class Document(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='documents')
    title = models.CharField(max_length=255, default='Untitled')
    content = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    time_complexity = models.CharField(max_length=64, blank=True, default='')
    space_complexity = models.CharField(max_length=64, blank=True, default='')
    justification = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f'{self.title} ({self.user.username})'
