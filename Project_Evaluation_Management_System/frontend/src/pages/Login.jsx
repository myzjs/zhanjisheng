import { useState } from 'react';
import { Card, Form, Input, Button, Checkbox, message, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/auth.jsx';
import axios from 'axios';

const Login = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // 防止重复提交：添加加载状态，禁用提交按钮
      if (isRegister) {
        // 注册逻辑
        const response = await axios.post('http://localhost:5001/api/register', values);
        message.success('注册成功，请登录');
        setIsRegister(false);
        form.resetFields();
      } else {
        // 登录逻辑
        const response = await axios.post('http://localhost:5001/api/login', values);
        login(response.data.token, response.data.user);
        message.success('登录成功');
        navigate('/');
      }
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
    }}>
      <Card 
        title={isRegister ? '用户注册' : '系统登录'} 
        style={{ width: 400, borderRadius: 8, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)' }} 
      >
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
          </Form.Item>
          
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
          </Form.Item>
          
          {isRegister && (
            <>
              <Form.Item
                name="name"
                label="姓名"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input placeholder="请输入姓名" />
              </Form.Item>
              
              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入正确的邮箱格式' }
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder="请输入邮箱" />
              </Form.Item>
              
              <Form.Item
                name="role_id"
                label="角色"
                initialValue={8}
              >
                <Input type="number" placeholder="请输入角色ID (1-8)" />
              </Form.Item>
            </>
          )}
          
          {!isRegister && (
            <Form.Item>
              <Checkbox>记住我</Checkbox>
            </Form.Item>
          )}
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              style={{ width: '100%', marginBottom: 16 }}
            >
              {isRegister ? '注册' : '登录'}
            </Button>
          </Form.Item>
          
          <Divider>
            <Button 
              type="link" 
              onClick={() => setIsRegister(!isRegister)}
            >
              {isRegister ? '已有账号？去登录' : '没有账号？去注册'}
            </Button>
          </Divider>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
