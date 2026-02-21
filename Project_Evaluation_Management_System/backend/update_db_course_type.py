from app import app
from extensions import db
from models import TrainingCourseware

with app.app_context():
    # 检查training_courseware表是否存在course_type列
    inspector = db.inspect(db.engine)
    columns = [column['name'] for column in inspector.get_columns('training_courseware')]
    
    if 'course_type' not in columns:
        # 添加course_type列
        db.engine.execute('ALTER TABLE training_courseware ADD COLUMN course_type INTEGER')
        print("Added course_type column to training_courseware table")
    else:
        print("course_type column already exists in training_courseware table")
    
    print("Database update completed successfully")