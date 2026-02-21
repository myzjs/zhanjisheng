from app import app
from extensions import db
from models import SystemDictionary
from sqlalchemy import inspect

# 检查并创建系统字典表
def create_system_dictionary_table():
    inspector = inspect(db.engine)
    if not inspector.has_table('system_dictionary'):
        print('Creating system_dictionary table...')
        # 创建表
        SystemDictionary.__table__.create(db.engine)
        print('system_dictionary table created successfully!')
    else:
        print('system_dictionary table already exists.')

if __name__ == '__main__':
    print('Starting database update...')
    with app.app_context():
        create_system_dictionary_table()
    print('Database update completed successfully!')
