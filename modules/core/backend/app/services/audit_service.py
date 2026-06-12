from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from uuid import UUID

from app.models.audit_log import AuditLog
from app.schemas.audit_log import AuditLogCreate, AuditLogFilter


class AuditService:
    """Service for audit logging and compliance tracking"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def log_event(
        self,
        org_id: Optional[UUID],
        user_id: Optional[UUID],
        event_type: str,
        event_category: str,
        action: Optional[str] = None,
        event_description: Optional[str] = None,
        module_name: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[UUID] = None,
        resource_name: Optional[str] = None,
        old_values: Optional[Dict] = None,
        new_values: Optional[Dict] = None,
        changes: Optional[Dict] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        request_method: Optional[str] = None,
        request_path: Optional[str] = None,
        request_params: Optional[Dict] = None,
        status: str = "success",
        error_message: Optional[str] = None,
        session_id: Optional[UUID] = None,
        severity: str = "info",
        is_security_event: bool = False,
        compliance_category: Optional[str] = None,
    ) -> AuditLog:
        """
        Log an audit event.

        Args:
            org_id: Organization ID
            user_id: User ID who performed the action
            event_type: Event type (e.g., user.login, crm.account.create)
            event_category: Event category (auth, data, settings, etc.)
            action: Action performed (create, read, update, delete)
            event_description: Event description
            module_name: Module name (crm, hr, etc.)
            resource_type: Resource type (account, contact, etc.)
            resource_id: Resource ID
            resource_name: Resource name
            old_values: Old values (for updates)
            new_values: New values (for creates/updates)
            changes: Specific field changes
            ip_address: IP address
            user_agent: User agent
            request_method: HTTP method
            request_path: Request path
            request_params: Request parameters
            status: Operation status (success, failed, error)
            error_message: Error message if failed
            session_id: Session ID
            severity: Event severity (info, warning, critical)
            is_security_event: Is security event flag
            compliance_category: Compliance category (gdpr, hipaa, etc.)

        Returns:
            AuditLog: Created audit log entry
        """
        # Calculate changes if old and new values provided
        if old_values and new_values and not changes:
            changes = self._calculate_changes(old_values, new_values)

        audit_log = AuditLog(
            org_id=org_id,
            user_id=user_id,
            event_type=event_type,
            event_category=event_category,
            event_description=event_description,
            module_name=module_name,
            resource_type=resource_type,
            resource_id=resource_id,
            resource_name=resource_name,
            action=action,
            old_values=old_values,
            new_values=new_values,
            changes=changes,
            ip_address=ip_address,
            user_agent=user_agent,
            request_method=request_method,
            request_path=request_path,
            request_params=request_params,
            status=status,
            error_message=error_message,
            session_id=session_id,
            severity=severity,
            is_security_event=is_security_event,
            compliance_category=compliance_category,
        )

        self.db.add(audit_log)
        await self.db.flush()

        return audit_log

    async def get_audit_logs(
        self,
        filter_params: AuditLogFilter,
        org_id: Optional[UUID] = None
    ) -> tuple[List[AuditLog], int]:
        """
        Get audit logs with filtering and pagination.

        Args:
            filter_params: Filter parameters
            org_id: Organization ID for filtering

        Returns:
            tuple: (List of audit logs, total count)
        """
        # Build query
        query = select(AuditLog)
        count_query = select(func.count(AuditLog.id))

        # Apply filters
        conditions = []

        if org_id:
            conditions.append(AuditLog.org_id == org_id)

        if filter_params.user_id:
            conditions.append(AuditLog.user_id == filter_params.user_id)

        if filter_params.module_name:
            conditions.append(AuditLog.module_name == filter_params.module_name)

        if filter_params.resource_type:
            conditions.append(AuditLog.resource_type == filter_params.resource_type)

        if filter_params.resource_id:
            conditions.append(AuditLog.resource_id == filter_params.resource_id)

        if filter_params.event_category:
            conditions.append(AuditLog.event_category == filter_params.event_category)

        if filter_params.event_type:
            conditions.append(AuditLog.event_type == filter_params.event_type)

        if filter_params.action:
            conditions.append(AuditLog.action == filter_params.action)

        if filter_params.status:
            conditions.append(AuditLog.status == filter_params.status)

        if filter_params.severity:
            conditions.append(AuditLog.severity == filter_params.severity)

        if filter_params.is_security_event is not None:
            conditions.append(AuditLog.is_security_event == filter_params.is_security_event)

        if filter_params.date_from:
            conditions.append(AuditLog.created_date >= filter_params.date_from)

        if filter_params.date_to:
            conditions.append(AuditLog.created_date <= filter_params.date_to)

        if conditions:
            query = query.where(and_(*conditions))
            count_query = count_query.where(and_(*conditions))

        # Get total count
        total = await self.db.scalar(count_query)

        # Apply pagination
        offset = (filter_params.page - 1) * filter_params.page_size
        query = query.offset(offset).limit(filter_params.page_size)

        # Order by created_date desc
        query = query.order_by(AuditLog.created_date.desc())

        # Execute query
        result = await self.db.execute(query)
        logs = result.scalars().all()

        return list(logs), total or 0

    async def get_user_audit_logs(
        self,
        user_id: UUID,
        org_id: UUID,
        page: int = 1,
        page_size: int = 50
    ) -> tuple[List[AuditLog], int]:
        """Get audit logs for a specific user"""
        query = (
            select(AuditLog)
            .where(and_(AuditLog.user_id == user_id, AuditLog.org_id == org_id))
            .order_by(AuditLog.created_date.desc())
        )

        # Get total count
        count_query = select(func.count(AuditLog.id)).where(
            and_(AuditLog.user_id == user_id, AuditLog.org_id == org_id)
        )
        total = await self.db.scalar(count_query)

        # Apply pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size)

        result = await self.db.execute(query)
        logs = result.scalars().all()

        return list(logs), total or 0

    async def get_resource_audit_logs(
        self,
        resource_type: str,
        resource_id: UUID,
        org_id: UUID,
        page: int = 1,
        page_size: int = 50
    ) -> tuple[List[AuditLog], int]:
        """Get audit logs for a specific resource"""
        query = (
            select(AuditLog)
            .where(
                and_(
                    AuditLog.resource_type == resource_type,
                    AuditLog.resource_id == resource_id,
                    AuditLog.org_id == org_id
                )
            )
            .order_by(AuditLog.created_date.desc())
        )

        # Get total count
        count_query = select(func.count(AuditLog.id)).where(
            and_(
                AuditLog.resource_type == resource_type,
                AuditLog.resource_id == resource_id,
                AuditLog.org_id == org_id
            )
        )
        total = await self.db.scalar(count_query)

        # Apply pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size)

        result = await self.db.execute(query)
        logs = result.scalars().all()

        return list(logs), total or 0

    async def get_security_events(
        self,
        org_id: UUID,
        days: int = 7,
        page: int = 1,
        page_size: int = 50
    ) -> tuple[List[AuditLog], int]:
        """Get recent security events"""
        date_from = datetime.utcnow() - timedelta(days=days)

        query = (
            select(AuditLog)
            .where(
                and_(
                    AuditLog.org_id == org_id,
                    AuditLog.is_security_event == True,
                    AuditLog.created_date >= date_from
                )
            )
            .order_by(AuditLog.created_date.desc())
        )

        # Get total count
        count_query = select(func.count(AuditLog.id)).where(
            and_(
                AuditLog.org_id == org_id,
                AuditLog.is_security_event == True,
                AuditLog.created_date >= date_from
            )
        )
        total = await self.db.scalar(count_query)

        # Apply pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size)

        result = await self.db.execute(query)
        logs = result.scalars().all()

        return list(logs), total or 0

    def _calculate_changes(self, old_values: Dict, new_values: Dict) -> Dict:
        """Calculate field-level changes between old and new values"""
        changes = {}

        all_keys = set(old_values.keys()) | set(new_values.keys())

        for key in all_keys:
            old_val = old_values.get(key)
            new_val = new_values.get(key)

            if old_val != new_val:
                changes[key] = {
                    "old": old_val,
                    "new": new_val
                }

        return changes
