from app import app
from extensions import db
from models import StandardCatalog

with app.app_context():
    # 创建规范目录表
    db.create_all()
    print("Created standard_catalog table successfully")
    
    # 检查是否需要创建其他相关表
    inspector = db.inspect(db.engine)
    tables = inspector.get_table_names()
    
    print("Current tables in database:")
    for table in tables:
        print(f"- {table}")
    
    print("Database update completed successfully")
