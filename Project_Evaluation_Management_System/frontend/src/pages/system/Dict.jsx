import React from 'react';
import { Button, Space, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const Dict = () => {
  const navigate = useNavigate();

  // 跳转到评审类型页面
  const goToEvaluationType = () => {
    navigate('/system/evaluation-type');
  };

  // 跳转到评审级别页面
  const goToEvaluationLevel = () => {
    navigate('/system/evaluation-level');
  };

  return (
    <div className="system-dict">
      <Title level={2}>系统字典</Title>
      <p>系统字典页面内容</p>
      
      <div style={{ marginTop: 20 }}>
        <Space size="middle">
          <Button type="primary" onClick={goToEvaluationType}>
            评审类型
          </Button>
          <Button type="primary" onClick={goToEvaluationLevel}>
            评审级别
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default Dict;
