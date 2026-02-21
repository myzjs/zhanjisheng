import React, { useEffect, useState } from 'react';
import {
  Form, Input, Select, DatePicker, Button, 
  message, Row, Col, Spin
} from 'antd';
import {
  SaveOutlined, LeftOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../utils/auth';

const { Option } = Select;

const VendorResearchEditForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const { user } = useAuth();
  
  // 从URL获取模式、ID和任务名称
  const searchParams = new URLSearchParams(location.search);
  const mode = searchParams.get('mode'); // add 或 edit
  const id = searchParams.get('id');
  const taskName = searchParams.get('task_name');
  
  // 状态管理
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [systems, setSystems] = useState([]);
  const [researchTasks, setResearchTasks] = useState([]);
  
  // 获取数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 获取用户列表
        const usersResponse = await axios.get('http://localhost:5001/api/users');
        const usersData = usersResponse.data || [];
        setUsers(usersData);
        
        // 获取评审项目列表
        const projectsResponse = await axios.get('http://localhost:5001/api/evaluation-projects');
        const projectsData = projectsResponse.data || [];
        setProjects(projectsData);
        
        // 获取系统字典列表
        const systemsResponse = await axios.get('http://localhost:5001/api/system-dictionaries');
        const systemsData = systemsResponse.data || [];
        setSystems(systemsData);
        
        // 获取调研任务列表
        const tasksResponse = await axios.get('http://localhost:5001/api/research-tasks');
        setResearchTasks(tasksResponse.data || []);
        
        // 如果是编辑模式，获取现有记录
        if (mode === 'edit' && id) {
          const researchResponse = await axios.get(`http://localhost:5001/api/vendor-researches/${id}`);
          const record = researchResponse.data;
          form.setFieldsValue({
            research_date: record.research_date ? new Date(record.research_date) : null,
            researcher_id: record.researcher_id,
            project_id: record.project_id,
            task_name: record.task_name,
            system_id: record.system_id,
            manufacturer: record.manufacturer,
            remarks: record.remarks
          });
        } else if (mode === 'add') {
          // 设置默认值
          form.setFieldsValue({
            research_date: new Date(),
            researcher_id: user?.id || 1,
            project_id: projectsData[0]?.id || 1,
            task_name: taskName || '常州-1-3-2602-02',
            system_id: systemsData[0]?.id || null,
            manufacturer: '',
            remarks: ''
          });
        }
      } catch (error) {
        console.error('获取数据失败:', error);
        message.error('获取数据失败');
      } finally {
        setDataLoading(false);
      }
    };
    
    fetchData();
  }, [mode, id, user, form, taskName]);

  // 处理表单提交
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      let response;
      if (mode === 'edit' && id) {
        // 更新现有记录
        response = await axios.put(`http://localhost:5001/api/vendor-researches/${id}`, values);
        message.success('更新厂商调研成功');
      } else {
        // 创建新记录
        response = await axios.post('http://localhost:5001/api/vendor-researches', values);
        message.success('创建厂商调研成功');
      }
      
      // 返回列表页面
      navigate('/project/vendor-research-form');
    } catch (error) {
      console.error('提交失败:', error);
      message.error('操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 返回列表页面
  const handleBack = () => {
    navigate('/project/vendor-research-form');
  };

  if (dataLoading) {
    return (
      <div style={{ 
        padding: 24, 
        minHeight: '400px', 
        backgroundColor: '#f5f5f5',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Spin size="large" description="加载中..." />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, minHeight: '400px', backgroundColor: '#f5f5f5' }}>
      <div style={{ marginBottom: 20 }}>
        <Button 
          icon={<LeftOutlined />} 
          onClick={handleBack}
          style={{ marginBottom: 20 }}
        >
          返回厂商调研列表
        </Button>
        <h1 style={{ color: '#333', margin: 0 }}>
          {mode === 'add' ? '新增厂商调研' : '编辑厂商调研'}
        </h1>
      </div>
      
      <div style={{ backgroundColor: '#fff', padding: 24, borderRadius: 8, marginBottom: 20 }}>
        <Form
          form={form}
          layout="horizontal"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="research_date"
                label="调研日期"
                rules={[{ required: true, message: '请选择调研日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="researcher_id"
                label="调研人"
                rules={[{ required: true, message: '请选择调研人' }]}
              >
                <Select placeholder="请选择调研人">
                  {users.map(user => (
                    <Option key={user.id} value={user.id}>{user.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="project_id"
                label="项目名称"
                rules={[{ required: true, message: '请选择项目' }]}
              >
                <Select placeholder="请选择项目">
                  {projects.map(project => (
                    <Option key={project.id} value={project.id}>{project.project_name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="task_name"
                label="任务名称"
              >
                <Select placeholder="请选择任务名称" allowClear>
                  {researchTasks.map(task => (
                    <Option key={task.id} value={task.task_name}>{task.task_name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="system_id"
                label="系统名称"
              >
                <Select placeholder="请选择系统名称" allowClear>
                  {systems.map(system => (
                    <Option key={system.id} value={system.id}>{system.system_name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="manufacturer"
                label="制造商"
                rules={[{ required: true, message: '请输入制造商' }]}
              >
                <Input placeholder="请输入制造商" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="remarks"
                label="备注"
              >
                <Input.TextArea placeholder="请输入备注" rows={4} />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={24} style={{ textAlign: 'center', marginTop: 20 }}>
              <Button 
                type="primary" 
                icon={<SaveOutlined />} 
                htmlType="submit"
                loading={loading}
                style={{ marginRight: 10 }}
              >
                {mode === 'add' ? '保存' : '更新'}
              </Button>
              <Button onClick={handleBack}>
                取消
              </Button>
            </Col>
          </Row>
        </Form>
      </div>
    </div>
  );
};

export default VendorResearchEditForm;