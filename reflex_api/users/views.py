from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from rest_framework.permissions import AllowAny, IsAuthenticated

User = get_user_model()

class LoginView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('username') # The frontend might still send 'username' as the key
        password = request.data.get('password')

        if not email or not password:
            return Response({'detail': 'Please provide both email and password.'}, status=status.HTTP_400_BAD_REQUEST)

        # Find user by email
        try:
            user_obj = User.objects.get(email=email)
            user = authenticate(username=user_obj.username, password=password)
        except User.DoesNotExist:
            user = None

        if not user:
            return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'phone': user.phone,
                'role': user.role
            }
        })

class LogoutView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.user.auth_token.delete()
        return Response(status=status.HTTP_200_OK)
