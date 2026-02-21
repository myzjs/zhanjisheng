from app import app
from extensions import db
from models import ResearchQuestionnaire
from sqlalchemy import inspect

# 检查并创建调研问卷表
def create_research_questionnaire_table():
    inspector = inspect(db.engine)
    if not inspector.has_table('research_questionnaire'):
        print('Creating research_questionnaire table...')
        # 创建表
        ResearchQuestionnaire.__table__.create(db.engine)
        print('research_questionnaire table created successfully!')
    else:
        print('research_questionnaire table already exists.')

if __name__ == '__main__':
    print('Starting research questionnaire table creation...')
    with app.app_context():
        create_research_questionnaire_table()
    print('Research questionnaire table creation completed successfully!')
