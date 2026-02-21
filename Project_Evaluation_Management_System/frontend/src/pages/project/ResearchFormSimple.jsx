import { useState } from 'react';
import {
  Form, Input, Select, DatePicker, Button, 
  message, Row, Col
} from 'antd';
import {
  SaveOutlined, LeftOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;

const ResearchFormSimple = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 处理表单提交
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const values = await form.validateFields();
      console.log('Form values:', values);
      message.success('创建调研任务成功');
      navigate('/project/research');
    } catch (error) {
      console.error('提交失败:', error);
      message.error('操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 返回列表页面
  const handleBack = () => {
    navigate('/project/research');
  };

  return (
    <div style={{ padding: 24, minHeight: '400px', backgroundColor: '#f5f5f5' }}>
      <div style={{ marginBottom: 20 }}>
        <Button 
          icon={<LeftOutlined />} 
          onClick={handleBack}
          style={{ marginBottom: 20 }}
        >
          返回调研任务列表
        </Button>
        <h1 style={{ color: '#333', margin: 0 }}>新增调研任务</h1>
      </div>
      
      <div style={{ backgroundColor: '#fff', padding: 24, borderRadius: 8 }}>
        <Form
          form={form}
          layout="horizontal"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="project_type"
                label="项目类型"
                rules={[{ required: true, message: '请选择项目类型' }]}
              >
                <Select placeholder="请选择项目类型">
                  <Option value={1}>类型1</Option>
                  <Option value={2}>类型2</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="project_level"
                label="项目级别"
                rules={[{ required: true, message: '请选择项目级别' }]}
              >
                <Select placeholder="请选择项目级别">
                  <Option value={1}>级别1</Option>
                  <Option value={2}>级别2</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="task_name"
                label="任务名称"
                rules={[{ required: true, message: '请输入任务名称' }]}
              >
                <Input placeholder="请输入任务名称" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={24} style={{ textAlign: 'center', marginTop: 20 }}>
              <Button 
                type="primary" 
                icon={<SaveOutlined />} 
                onClick={handleSubmit} 
                loading={loading}
                style={{ marginRight: 10 }}
              >
                保存
              </Button>
              <Button 
                icon={<LeftOutlined />} 
                onClick={handleBack}
              >
                取消
              </Button>
            </Col>
          </Row>
        </Form>
      </div>
    </div>
  );
};

export default ResearchFormSimple;