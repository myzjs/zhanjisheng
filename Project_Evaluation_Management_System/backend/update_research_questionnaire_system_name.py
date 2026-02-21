from app import app
from extensions import db
from sqlalchemy import inspect

# 检查并更新调研问卷表，添加系统名称字段
def update_research_questionnaire_table():
    inspector = inspect(db.engine)
    columns = [column['name'] for column in inspector.get_columns('research_questionnaire')]
    
    if 'system_name' not in columns:
        print('Adding system_name column to research_questionnaire table...')
        # 使用ALTER TABLE语句添加列
        with db.engine.begin() as conn:
            conn.execute("ALTER TABLE research_questionnaire ADD COLUMN system_name INTEGER")
        print('system_name column added successfully!')
    else:
        print('system_name column already exists in research_questionnaire table.')

if __name__ == '__main__':
    print('Starting research questionnaire table update...')
    with app.app_context():
        update_research_questionnaire_table()
    print('Research questionnaire table update completed successfully!')
