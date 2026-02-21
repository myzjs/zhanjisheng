from app import app
from extensions import db
from models import EvaluationLevel
from sqlalchemy import inspect, text

with app.app_context():
    # 检查表是否存在
    inspector = inspect(db.engine)
    if inspector.has_table('evaluation_level'):
        # 检查字段是否存在
        columns = [column['name'] for column in inspector.get_columns('evaluation_level')]
        
        if 'numeric_level' not in columns:
            # 添加字段
            with db.engine.begin() as conn:
                conn.execute(text('ALTER TABLE evaluation_level ADD COLUMN numeric_level INTEGER'))
            print('成功添加numeric_level字段')
        else:
            print('numeric_level字段已存在')
    else:
        print('evaluation_level表不存在')
