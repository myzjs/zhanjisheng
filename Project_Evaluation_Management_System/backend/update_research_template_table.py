from app import app
from extensions import db
from models import ResearchTemplate
from sqlalchemy import inspect

# 检查并创建调研模板表
def create_research_template_table():
    inspector = inspect(db.engine)
    
    # 检查是否存在 research_questionnaire 表
    if inspector.has_table('research_questionnaire'):
        print('Found research_questionnaire table, need to rename to research_template')
        
        # 使用 SQLite 的 ALTER TABLE 语句重命名表
        with db.engine.begin() as conn:
            conn.execute("ALTER TABLE research_questionnaire RENAME TO research_template")
        print('Successfully renamed research_questionnaire to research_template')
    elif not inspector.has_table('research_template'):
        print('Creating research_template table...')
        # 创建表
        ResearchTemplate.__table__.create(db.engine)
        print('research_template table created successfully!')
    else:
        print('research_template table already exists.')

if __name__ == '__main__':
    print('Starting research template table update...')
    with app.app_context():
        create_research_template_table()
    print('Research template table update completed successfully!')
