from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Dict, Any, List
import httpx
import asyncio
from datetime import datetime

from app.core.database import get_db

router = APIRouter()

# Module configurations
MODULES = {
    "accounting": {
        "name": "Accounting & Finance",
        "url": "http://accounting-backend:8000",
        "frontend_port": 3101,
        "endpoints": ["/api/v1/accounts", "/api/v1/transactions"],
        "icon": "DollarSign"
    },
    "administration": {
        "name": "Administration",
        "url": "http://administration-backend:8000",
        "frontend_port": 3108,
        "endpoints": ["/api/v1/executive-board", "/api/v1/legal-cases"],
        "icon": "Building"
    },
    "hr": {
        "name": "Human Resources",
        "url": "http://hr-backend:8000",
        "frontend_port": 3004,
        "endpoints": ["/api/v1/employees", "/api/v1/departments"],
        "icon": "Users"
    },
    "marketing": {
        "name": "Marketing",
        "url": "http://marketing-backend:8000",
        "frontend_port": 3103,
        "endpoints": ["/api/v1/campaigns", "/api/v1/leads"],
        "icon": "TrendingUp"
    },
    "sales": {
        "name": "Sales",
        "url": "http://sales-backend:8000",
        "frontend_port": 3104,
        "endpoints": ["/api/v1/opportunities", "/api/v1/customers"],
        "icon": "ShoppingCart"
    },
    "production": {
        "name": "Production/Operations",
        "url": "http://production-backend:8000",
        "frontend_port": 3107,
        "endpoints": ["/api/v1/products", "/api/v1/work-orders"],
        "icon": "Factory"
    },
    "rd": {
        "name": "Research & Development",
        "url": "http://rd-backend:8000",
        "frontend_port": 3106,
        "endpoints": ["/api/v1/projects", "/api/v1/innovations"],
        "icon": "Lightbulb"
    },
    "legal": {
        "name": "Legal & Compliance",
        "url": "http://legal-backend:8000",
        "frontend_port": 3105,
        "endpoints": ["/api/v1/contracts", "/api/v1/regulations"],
        "icon": "Scale"
    }
}


async def check_module_health(module_key: str, config: Dict[str, Any]) -> Dict[str, Any]:
    """Check health of a single module"""
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            start_time = datetime.now()

            # Try primary health endpoint
            try:
                response = await client.get(f"{config['url']}/health")
                response_time = (datetime.now() - start_time).total_seconds() * 1000

                if response.status_code == 200:
                    return {
                        "module": module_key,
                        "name": config["name"],
                        "status": "online",
                        "response_time_ms": round(response_time, 2),
                        "frontend_port": config["frontend_port"],
                        "icon": config["icon"]
                    }
            except:
                # If health endpoint doesn't exist, try first data endpoint
                response = await client.get(f"{config['url']}{config['endpoints'][0]}")
                response_time = (datetime.now() - start_time).total_seconds() * 1000

                if response.status_code in [200, 404]:  # 404 means API is up, just no data
                    return {
                        "module": module_key,
                        "name": config["name"],
                        "status": "online",
                        "response_time_ms": round(response_time, 2),
                        "frontend_port": config["frontend_port"],
                        "icon": config["icon"]
                    }

    except Exception as e:
        return {
            "module": module_key,
            "name": config["name"],
            "status": "offline",
            "error": str(e),
            "frontend_port": config["frontend_port"],
            "icon": config["icon"]
        }

    return {
        "module": module_key,
        "name": config["name"],
        "status": "error",
        "frontend_port": config["frontend_port"],
        "icon": config["icon"]
    }


async def fetch_module_stats(module_key: str, config: Dict[str, Any]) -> Dict[str, Any]:
    """Fetch statistics from a module"""
    stats = {"module": module_key, "name": config["name"]}

    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            for endpoint in config["endpoints"]:
                try:
                    response = await client.get(f"{config['url']}{endpoint}")
                    if response.status_code == 200:
                        data = response.json()
                        # Extract count from various response formats
                        if isinstance(data, dict):
                            for key, value in data.items():
                                if isinstance(value, list):
                                    stats[key] = len(value)
                        elif isinstance(data, list):
                            stats["items"] = len(data)
                except:
                    continue
    except:
        pass

    return stats


@router.get("/overview")
async def get_control_room_overview(db: AsyncSession = Depends(get_db)):
    """
    Get comprehensive overview of all modules and system status
    """
    try:
        # Check health of all modules in parallel
        health_tasks = [
            check_module_health(key, config)
            for key, config in MODULES.items()
        ]
        module_health = await asyncio.gather(*health_tasks)

        # Calculate system statistics
        total_modules = len(module_health)
        online_modules = sum(1 for m in module_health if m["status"] == "online")
        offline_modules = sum(1 for m in module_health if m["status"] == "offline")

        # Get database statistics
        db_stats = {}
        try:
            # Get table counts from database
            tables = [
                "executive_board", "legal_cases", "compliance_policies",
                "compliance_audits", "strategic_initiatives"
            ]

            for table in tables:
                result = await db.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count = result.scalar()
                db_stats[table] = count
        except Exception as e:
            print(f"Error fetching DB stats: {e}")

        return {
            "overview": {
                "total_modules": total_modules,
                "online_modules": online_modules,
                "offline_modules": offline_modules,
                "system_health": "healthy" if online_modules >= total_modules * 0.7 else "degraded",
                "timestamp": datetime.utcnow().isoformat()
            },
            "modules": module_health,
            "administration_stats": db_stats
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch control room overview: {str(e)}")


@router.get("/modules-status")
async def get_modules_status():
    """
    Get detailed status of all modules
    """
    try:
        # Check health of all modules in parallel
        health_tasks = [
            check_module_health(key, config)
            for key, config in MODULES.items()
        ]
        module_health = await asyncio.gather(*health_tasks)

        return {
            "modules": module_health,
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch modules status: {str(e)}")


@router.get("/modules-stats")
async def get_modules_stats():
    """
    Get statistics from all modules
    """
    try:
        # Fetch stats from all modules in parallel
        stats_tasks = [
            fetch_module_stats(key, config)
            for key, config in MODULES.items()
        ]
        module_stats = await asyncio.gather(*stats_tasks)

        return {
            "modules": module_stats,
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch modules stats: {str(e)}")


@router.get("/recent-activities")
async def get_recent_activities(db: AsyncSession = Depends(get_db), limit: int = 20):
    """
    Get recent activities across all modules (Administration, Accounting, etc.)
    """
    try:
        activities = []

        # Fetch accounting transactions from accounting module
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                response = await client.get("http://accounting-backend:8000/api/v1/transactions/")
                if response.status_code == 200:
                    transactions = response.json()
                    # Take the most recent transactions
                    for txn in transactions[:limit // 4]:
                        activities.append({
                            "id": txn.get("id", ""),
                            "title": txn.get("description", "Transaction"),
                            "type": "Transaction",
                            "status": txn.get("status", "posted"),
                            "date": txn.get("created_at", txn.get("date", "")),
                            "module": "accounting",
                            "url": f"http://localhost:3101/transactions"
                        })
        except Exception as e:
            pass  # Silently fail to prevent breaking the entire activity feed

        # Legal Cases
        result = await db.execute(
            text("""
                SELECT id, case_title, status, created_at, 'legal_case' as type
                FROM legal_cases
                ORDER BY created_at DESC
                LIMIT :limit
            """),
            {"limit": limit // 4}
        )
        for row in result:
            activities.append({
                "id": str(row.id),
                "title": row.case_title,
                "type": "Legal Case",
                "status": row.status,
                "date": row.created_at.isoformat() if row.created_at else datetime.utcnow().isoformat(),
                "module": "administration",
                "url": f"/legal-cases/{row.id}"
            })

        # Compliance Audits
        result = await db.execute(
            text("""
                SELECT id, audit_title, status, created_at, 'audit' as type
                FROM compliance_audits
                ORDER BY created_at DESC
                LIMIT :limit
            """),
            {"limit": limit // 4}
        )
        for row in result:
            activities.append({
                "id": str(row.id),
                "title": row.audit_title,
                "type": "Compliance Audit",
                "status": row.status,
                "date": row.created_at.isoformat() if row.created_at else datetime.utcnow().isoformat(),
                "module": "administration",
                "url": f"/compliance-audits/{row.id}"
            })

        # Strategic Initiatives
        result = await db.execute(
            text("""
                SELECT id, initiative_name, status, created_at, 'initiative' as type
                FROM strategic_initiatives
                ORDER BY created_at DESC
                LIMIT :limit
            """),
            {"limit": limit // 4}
        )
        for row in result:
            activities.append({
                "id": str(row.id),
                "title": row.initiative_name,
                "type": "Strategic Initiative",
                "status": row.status,
                "date": row.created_at.isoformat() if row.created_at else datetime.utcnow().isoformat(),
                "module": "administration",
                "url": f"/strategic-initiatives/{row.id}"
            })

        # Sort all activities by date
        activities.sort(key=lambda x: x["date"], reverse=True)

        return {
            "activities": activities[:limit],
            "count": len(activities[:limit])
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch recent activities: {str(e)}")


@router.get("/alerts")
async def get_system_alerts(db: AsyncSession = Depends(get_db)):
    """
    Get system alerts and critical issues
    """
    try:
        alerts = []

        # Check for offline modules
        health_tasks = [
            check_module_health(key, config)
            for key, config in MODULES.items()
        ]
        module_health = await asyncio.gather(*health_tasks)

        offline_modules = [m for m in module_health if m["status"] == "offline"]
        for module in offline_modules:
            alerts.append({
                "id": f"module-offline-{module['module']}",
                "type": "module_offline",
                "severity": "high",
                "title": f"{module['name']} is Offline",
                "description": f"The {module['name']} module is currently unavailable",
                "timestamp": datetime.utcnow().isoformat()
            })

        # Check for high-priority legal cases
        result = await db.execute(
            text("""
                SELECT COUNT(*) as count
                FROM legal_cases
                WHERE priority = 'high' AND status IN ('open', 'in_progress')
            """)
        )
        high_priority_cases = result.scalar() or 0

        if high_priority_cases > 0:
            alerts.append({
                "id": "high-priority-legal-cases",
                "type": "legal_attention",
                "severity": "medium",
                "title": f"{high_priority_cases} High Priority Legal Cases",
                "description": f"There are {high_priority_cases} high priority legal cases requiring attention",
                "timestamp": datetime.utcnow().isoformat()
            })

        # Check for overdue compliance audits
        result = await db.execute(
            text("""
                SELECT COUNT(*) as count
                FROM compliance_audits
                WHERE status != 'completed' AND scheduled_date < CURRENT_DATE
            """)
        )
        overdue_audits = result.scalar() or 0

        if overdue_audits > 0:
            alerts.append({
                "id": "overdue-audits",
                "type": "compliance_risk",
                "severity": "high",
                "title": f"{overdue_audits} Overdue Compliance Audits",
                "description": f"{overdue_audits} compliance audits are overdue and need immediate attention",
                "timestamp": datetime.utcnow().isoformat()
            })

        return {
            "alerts": alerts,
            "count": len(alerts),
            "critical_count": sum(1 for a in alerts if a["severity"] == "high")
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch alerts: {str(e)}")
