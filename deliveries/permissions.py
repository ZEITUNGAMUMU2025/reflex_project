from rest_framework import permissions

class IsRetailer(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'RETAILER'

class IsDispatcher(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'DISPATCHER'

class IsRider(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'RIDER'

class DeliveryPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Retailer can create. Dispatcher and Rider cannot create.
        if view.action == 'create':
            return request.user.role == 'RETAILER'
        
        return True

    def has_object_permission(self, request, view, obj):
        # Retailers can only view their own deliveries
        if request.user.role == 'RETAILER':
            return obj.retailer == request.user and view.action in ['retrieve']
            
        # Dispatchers can view all, but actions are restricted in views
        if request.user.role == 'DISPATCHER':
            return True
            
        # Riders can only view/update deliveries assigned to them
        if request.user.role == 'RIDER':
            return obj.rider == request.user

        return False
