from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID

from app.models.setting import Setting
from app.schemas.setting import SettingCreate, SettingUpdate


class SettingService:
    """Service for managing hierarchical settings (system, org, module, user)"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_setting(
        self,
        setting_key: str,
        org_id: Optional[UUID] = None,
        user_id: Optional[UUID] = None,
        module_name: Optional[str] = None
    ) -> Optional[Setting]:
        """
        Get a setting value with hierarchical lookup.

        Lookup order:
        1. User-specific setting (if user_id provided)
        2. Organization-specific setting (if org_id provided)
        3. Module default setting (if module_name provided)
        4. System default setting

        Args:
            setting_key: Setting key
            org_id: Organization ID
            user_id: User ID
            module_name: Module name

        Returns:
            Optional[Setting]: Setting object or None
        """
        # Try user-specific setting first
        if user_id:
            result = await self.db.execute(
                select(Setting)
                .where(
                    and_(
                        Setting.setting_key == setting_key,
                        Setting.user_id == user_id,
                        Setting.is_active == True,
                        Setting.deleted_flag == False
                    )
                )
            )
            setting = result.scalar_one_or_none()
            if setting:
                return setting

        # Try organization-specific setting
        if org_id:
            result = await self.db.execute(
                select(Setting)
                .where(
                    and_(
                        Setting.setting_key == setting_key,
                        Setting.org_id == org_id,
                        Setting.user_id.is_(None),
                        Setting.is_active == True,
                        Setting.deleted_flag == False
                    )
                )
            )
            setting = result.scalar_one_or_none()
            if setting:
                return setting

        # Try module default setting
        if module_name:
            result = await self.db.execute(
                select(Setting)
                .where(
                    and_(
                        Setting.setting_key == setting_key,
                        Setting.module_name == module_name,
                        Setting.org_id.is_(None),
                        Setting.user_id.is_(None),
                        Setting.is_active == True,
                        Setting.deleted_flag == False
                    )
                )
            )
            setting = result.scalar_one_or_none()
            if setting:
                return setting

        # Try system default setting
        result = await self.db.execute(
            select(Setting)
            .where(
                and_(
                    Setting.setting_key == setting_key,
                    Setting.scope == 'system',
                    Setting.org_id.is_(None),
                    Setting.user_id.is_(None),
                    Setting.is_active == True,
                    Setting.deleted_flag == False
                )
            )
        )
        return result.scalar_one_or_none()

    async def get_setting_value(
        self,
        setting_key: str,
        org_id: Optional[UUID] = None,
        user_id: Optional[UUID] = None,
        module_name: Optional[str] = None,
        default: Any = None
    ) -> Any:
        """
        Get setting value with default fallback.

        Args:
            setting_key: Setting key
            org_id: Organization ID
            user_id: User ID
            module_name: Module name
            default: Default value if setting not found

        Returns:
            Any: Setting value or default
        """
        setting = await self.get_setting(setting_key, org_id, user_id, module_name)
        if setting:
            return setting.setting_value
        return default

    async def create_setting(
        self,
        setting_data: SettingCreate,
        created_by: UUID
    ) -> Setting:
        """
        Create a new setting.

        Args:
            setting_data: Setting creation data
            created_by: User ID who is creating the setting

        Returns:
            Setting: Created setting
        """
        setting = Setting(
            org_id=setting_data.org_id,
            user_id=setting_data.user_id,
            setting_key=setting_data.setting_key,
            setting_value=setting_data.setting_value,
            value_type=setting_data.value_type,
            setting_category=setting_data.setting_category,
            module_name=setting_data.module_name,
            setting_name=setting_data.setting_name,
            setting_description=setting_data.setting_description,
            setting_group=setting_data.setting_group,
            default_value=setting_data.default_value,
            is_required=setting_data.is_required,
            is_encrypted=setting_data.is_encrypted,
            is_public=setting_data.is_public,
            validation_rules=setting_data.validation_rules,
            scope=setting_data.scope,
            is_active=True,
            created_by=created_by,
            last_modified_by=created_by,
        )
        self.db.add(setting)
        await self.db.commit()
        await self.db.refresh(setting)

        return setting

    async def update_setting(
        self,
        setting_id: UUID,
        setting_data: SettingUpdate,
        updated_by: UUID
    ) -> Setting:
        """
        Update an existing setting.

        Args:
            setting_id: Setting ID
            setting_data: Setting update data
            updated_by: User ID who is updating the setting

        Returns:
            Setting: Updated setting
        """
        setting = await self.db.get(Setting, setting_id)
        if not setting:
            return None

        # Update fields
        setting.setting_value = setting_data.setting_value

        if setting_data.setting_name is not None:
            setting.setting_name = setting_data.setting_name
        if setting_data.setting_description is not None:
            setting.setting_description = setting_data.setting_description
        if setting_data.is_active is not None:
            setting.is_active = setting_data.is_active

        setting.last_modified_by = updated_by
        setting.last_modified_date = datetime.utcnow()

        await self.db.commit()
        await self.db.refresh(setting)

        return setting

    async def set_setting(
        self,
        setting_key: str,
        setting_value: Any,
        org_id: Optional[UUID] = None,
        user_id: Optional[UUID] = None,
        module_name: Optional[str] = None,
        updated_by: Optional[UUID] = None
    ) -> Setting:
        """
        Set a setting value (create or update).

        Args:
            setting_key: Setting key
            setting_value: Setting value
            org_id: Organization ID
            user_id: User ID
            module_name: Module name
            updated_by: User ID who is updating

        Returns:
            Setting: Created or updated setting
        """
        # Try to find existing setting
        conditions = [
            Setting.setting_key == setting_key,
            Setting.deleted_flag == False
        ]

        if user_id:
            conditions.append(Setting.user_id == user_id)
        elif org_id:
            conditions.append(Setting.org_id == org_id)
            conditions.append(Setting.user_id.is_(None))
        else:
            conditions.append(Setting.org_id.is_(None))
            conditions.append(Setting.user_id.is_(None))

        if module_name:
            conditions.append(Setting.module_name == module_name)

        result = await self.db.execute(
            select(Setting).where(and_(*conditions))
        )
        setting = result.scalar_one_or_none()

        if setting:
            # Update existing
            setting.setting_value = setting_value
            setting.last_modified_by = updated_by
            setting.last_modified_date = datetime.utcnow()
        else:
            # Create new
            scope = "user" if user_id else ("organization" if org_id else "system")
            setting = Setting(
                org_id=org_id,
                user_id=user_id,
                module_name=module_name,
                setting_key=setting_key,
                setting_value=setting_value,
                value_type=self._infer_value_type(setting_value),
                setting_category="general",
                scope=scope,
                is_active=True,
                created_by=updated_by,
                last_modified_by=updated_by,
            )
            self.db.add(setting)

        await self.db.commit()
        await self.db.refresh(setting)

        return setting

    async def get_all_settings(
        self,
        org_id: Optional[UUID] = None,
        user_id: Optional[UUID] = None,
        module_name: Optional[str] = None,
        category: Optional[str] = None,
        scope: Optional[str] = None,
        public_only: bool = False
    ) -> List[Setting]:
        """
        Get all settings with optional filtering.

        Args:
            org_id: Filter by organization ID
            user_id: Filter by user ID
            module_name: Filter by module name
            category: Filter by category
            scope: Filter by scope
            public_only: Return only public settings

        Returns:
            List[Setting]: List of settings
        """
        conditions = [
            Setting.is_active == True,
            Setting.deleted_flag == False
        ]

        if org_id:
            conditions.append(Setting.org_id == org_id)
        if user_id:
            conditions.append(Setting.user_id == user_id)
        if module_name:
            conditions.append(Setting.module_name == module_name)
        if category:
            conditions.append(Setting.setting_category == category)
        if scope:
            conditions.append(Setting.scope == scope)
        if public_only:
            conditions.append(Setting.is_public == True)

        result = await self.db.execute(
            select(Setting)
            .where(and_(*conditions))
            .order_by(Setting.setting_category, Setting.setting_key)
        )
        return list(result.scalars().all())

    async def get_public_settings(
        self,
        org_id: Optional[UUID] = None,
        module_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get public settings as key-value dictionary (safe for frontend).

        Args:
            org_id: Organization ID
            module_name: Module name

        Returns:
            Dict[str, Any]: Settings dictionary
        """
        settings = await self.get_all_settings(
            org_id=org_id,
            module_name=module_name,
            public_only=True
        )

        settings_dict = {}
        for setting in settings:
            settings_dict[setting.setting_key] = setting.setting_value

        return settings_dict

    async def delete_setting(
        self,
        setting_id: UUID,
        deleted_by: UUID
    ):
        """
        Delete a setting (soft delete).

        Args:
            setting_id: Setting ID
            deleted_by: User ID who is deleting
        """
        setting = await self.db.get(Setting, setting_id)
        if not setting:
            return

        setting.is_active = False
        setting.deleted_flag = True
        setting.deleted_date = datetime.utcnow()
        setting.deleted_by = deleted_by

        await self.db.commit()

    async def bulk_update_settings(
        self,
        settings: List[Dict[str, Any]],
        org_id: Optional[UUID] = None,
        user_id: Optional[UUID] = None,
        updated_by: Optional[UUID] = None
    ) -> List[Setting]:
        """
        Bulk update multiple settings.

        Args:
            settings: List of settings to update [{key, value}, ...]
            org_id: Organization ID
            user_id: User ID
            updated_by: User ID who is updating

        Returns:
            List[Setting]: Updated settings
        """
        updated_settings = []
        for setting_data in settings:
            setting = await self.set_setting(
                setting_key=setting_data.get("key"),
                setting_value=setting_data.get("value"),
                org_id=org_id,
                user_id=user_id,
                updated_by=updated_by
            )
            updated_settings.append(setting)

        return updated_settings

    def _infer_value_type(self, value: Any) -> str:
        """Infer value type from Python value"""
        if isinstance(value, bool):
            return "boolean"
        elif isinstance(value, (int, float)):
            return "number"
        elif isinstance(value, str):
            return "string"
        elif isinstance(value, list):
            return "array"
        elif isinstance(value, dict):
            return "object"
        else:
            return "string"
