from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any

from app.db.session import get_db
from app.models.user import User
from app.api.dependencies import get_current_user
from app.services.setting_service import SettingService


router = APIRouter()


@router.get("")
async def get_all_user_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all settings for the current user (theme + features).

    Returns a structured response with theme and features separated.
    """
    setting_service = SettingService(db)

    # Get user-specific settings
    user_settings = await setting_service.get_all_settings(
        user_id=current_user.id
    )

    # Organize settings by category
    theme_settings = {}
    feature_settings = {}

    for setting in user_settings:
        if setting.setting_key.startswith("theme."):
            # Remove "theme." prefix
            key = setting.setting_key.replace("theme.", "")
            theme_settings[key] = setting.setting_value
        elif setting.setting_key.startswith("features."):
            # Remove "features." prefix
            key = setting.setting_key.replace("features.", "")
            feature_settings[key] = setting.setting_value

    return {
        "theme": theme_settings if theme_settings else None,
        "features": feature_settings if feature_settings else None
    }


@router.get("/theme")
async def get_theme_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get theme settings for the current user."""
    setting_service = SettingService(db)

    # Get all theme settings
    user_settings = await setting_service.get_all_settings(
        user_id=current_user.id
    )

    theme_settings = {}
    for setting in user_settings:
        if setting.setting_key.startswith("theme."):
            key = setting.setting_key.replace("theme.", "")
            theme_settings[key] = setting.setting_value

    return {"theme": theme_settings}


@router.put("/theme")
async def save_theme_settings(
    theme_data: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Save theme settings for the current user.

    Accepts a dictionary of theme settings and saves each as a user setting.
    """
    setting_service = SettingService(db)

    saved_settings = []
    for key, value in theme_data.items():
        setting = await setting_service.set_setting(
            setting_key=f"theme.{key}",
            setting_value=value,
            user_id=current_user.id,
            module_name="core",
            updated_by=current_user.id
        )
        saved_settings.append(setting)

    return {
        "message": "Theme settings saved successfully",
        "settings_count": len(saved_settings)
    }


@router.get("/features")
async def get_feature_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get feature settings for the current user."""
    setting_service = SettingService(db)

    # Get all feature settings
    user_settings = await setting_service.get_all_settings(
        user_id=current_user.id
    )

    feature_settings = {}
    for setting in user_settings:
        if setting.setting_key.startswith("features."):
            key = setting.setting_key.replace("features.", "")
            feature_settings[key] = setting.setting_value

    return {"features": feature_settings}


@router.put("/features")
async def save_feature_settings(
    feature_data: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Save feature settings for the current user.

    Accepts a dictionary of feature settings and saves each as a user setting.
    """
    setting_service = SettingService(db)

    saved_settings = []
    for key, value in feature_data.items():
        setting = await setting_service.set_setting(
            setting_key=f"features.{key}",
            setting_value=value,
            user_id=current_user.id,
            module_name="core",
            updated_by=current_user.id
        )
        saved_settings.append(setting)

    return {
        "message": "Feature settings saved successfully",
        "settings_count": len(saved_settings)
    }


@router.put("")
async def save_all_settings(
    settings_data: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Save all user settings (theme + features) at once.

    Expects a dictionary with "theme" and/or "features" keys.
    """
    setting_service = SettingService(db)

    saved_count = 0

    # Save theme settings
    if "theme" in settings_data and settings_data["theme"]:
        for key, value in settings_data["theme"].items():
            await setting_service.set_setting(
                setting_key=f"theme.{key}",
                setting_value=value,
                user_id=current_user.id,
                module_name="core",
                updated_by=current_user.id
            )
            saved_count += 1

    # Save feature settings
    if "features" in settings_data and settings_data["features"]:
        for key, value in settings_data["features"].items():
            await setting_service.set_setting(
                setting_key=f"features.{key}",
                setting_value=value,
                user_id=current_user.id,
                module_name="core",
                updated_by=current_user.id
            )
            saved_count += 1

    return {
        "message": "Settings saved successfully",
        "settings_count": saved_count
    }
