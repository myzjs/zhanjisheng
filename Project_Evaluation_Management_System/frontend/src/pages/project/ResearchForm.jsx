import React, { useEffect, useState, useRef } from 'react';
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
import { pinyin } from 'pinyin-pro';

const { Option } = Select;

const ProjectResearchForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const { user } = useAuth();
  const formMounted = useRef(false);
  
  // 从URL获取任务ID（编辑模式）和项目ID
  const taskId = new URLSearchParams(location.search).get('id');
  const projectIdFromUrl = new URLSearchParams(location.search).get('project_id');
  const isEditMode = !!taskId;

  // 状态管理
  const [evaluationTypes] = useState([
    { id: 1, evaluation_type: '电子病历' },
    { id: 2, evaluation_type: '智能服务' },
    { id: 3, evaluation_type: '互联互通' }
  ]);
  
  const [evaluationLevels] = useState([
    { id: 1, evaluation_level: '四级' },
    { id: 2, evaluation_level: '五级' },
    { id: 3, evaluation_level: '六级' }
  ]);
  
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [taskCount, setTaskCount] = useState(0);
  
  // 从后端API获取评审项目清单
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/evaluation-projects');
        if (response.data && Array.isArray(response.data)) {
          setProjects(response.data.map(project => ({
            id: project.id,
            project_name: project.project_name,
            project_type: project.project_type,
            project_level: project.project_level
          })));
        }
      } catch (error) {
        console.error('获取评审项目清单失败:', error);
        message.error('获取评审项目清单失败');
      }
    };
    
    fetchProjects();
  }, []);
  
  // 从后端API获取用户表数据和评审项目表数据
  useEffect(() => {
    const fetchUsersAndProjectManagers = async () => {
      try {
        // 获取用户表数据
        const usersResponse = await axios.get('http://localhost:5001/api/users');
        const allUsers = usersResponse.data && Array.isArray(usersResponse.data) ? usersResponse.data : [];
        
        // 获取评审项目表数据，提取评审项目经理id
        const projectsResponse = await axios.get('http://localhost:5001/api/evaluation-projects');
        const projectManagers = new Set();
        
        if (projectsResponse.data && Array.isArray(projectsResponse.data)) {
          projectsResponse.data.forEach(project => {
            if (project.project_manager_id) {
              projectManagers.add(project.project_manager_id);
            }
          });
        }
        
        // 获取当前登录用户ID
        const currentUserId = user && user.id ? user.id : 1;
        
        // 过滤用户列表，保留评审项目经理和当前登录用户
        const filteredUsers = allUsers
          .filter(user => projectManagers.has(user.id) || user.id === currentUserId)
          .map(user => ({
            id: user.id,
            name: user.name || user.username
          }));
        
        setUsers(filteredUsers);
      } catch (error) {
        console.error('获取用户表数据失败:', error);
        message.error('获取用户表数据失败');
      }
    };
    
    fetchUsersAndProjectManagers();
  }, [user]);

  // 设置默认值
  useEffect(() => {
    // 延迟设置默认值，确保Form组件已经挂载
    setTimeout(() => {
      if (formMounted.current) {
        // 设置创建人和调研人的默认值为当前登录用户或默认用户
        const defaultUserId = user && user.id ? user.id : 1;
        try {
          form.setFieldsValue({ 
            creator_id: defaultUserId,
            researcher_id: defaultUserId,
            task_status: '进度中'
          });
        } catch (error) {
          console.log('Form not ready yet:', error);
        }
      }
    }, 100);
  }, [user, form]);

  // 设置计划完成时间的默认值为当前时间+15个工作日
  useEffect(() => {
    // 延迟设置默认值，确保Form组件已经挂载
    setTimeout(() => {
      if (formMounted.current) {
        const calculateDefaultCompletionTime = () => {
          const date = new Date();
          let workdaysAdded = 0;
          
          while (workdaysAdded < 10) {
            date.setDate(date.getDate() + 1);
            // 跳过周末
            if (date.getDay() !== 0 && date.getDay() !== 6) {
              workdaysAdded++;
            }
          }
          
          try {
            form.setFieldsValue({ planned_completion_time: date });
          } catch (error) {
            console.log('Form not ready yet:', error);
          }
        };

        calculateDefaultCompletionTime();
      }
    }, 200);
  }, [form]);

  // 模拟数据加载
  useEffect(() => {
    // 模拟数据加载延迟
    const timer = setTimeout(() => {
      setDataLoading(false);
      console.log('数据加载完成');
    }, 500);

    return () => clearTimeout(timer);
  }, []);
  
  // 生成任务名称
  const generateTaskName = (projectId) => {
    const selectedProject = projects.find(project => project.id === projectId);
    if (!selectedProject) return '';

    // 提取项目名称的拼音首字母
    const getPinyinFirstLetters = (text) => {
      // 使用pinyin-pro库提取汉字拼音首字母
      const result = pinyin(text, {
        pattern: 'first',
        toneType: 'none',
        removeNonZh: true
      });
      
      // 严格截取前2位，确保至少有两个字符
      return result.length >= 2 ? result.substring(0, 2) : (result + 'XX').substring(0, 2);
    };

    const projectPinyin = getPinyinFirstLetters(selectedProject.project_name);
    const projectType = selectedProject.project_type || '0';
    const projectLevel = selectedProject.project_level || '0';
    
    // 获取当前年份和月份
    const now = new Date();
    const year = now.getFullYear().toString().substring(2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    
    // 生成序列号
    const sequence = (taskCount + 1).toString().padStart(2, '0');
    
    // 按照要求的格式组合任务名称
    const taskName = `${projectPinyin}-${projectType}-${projectLevel}-${year}${month}-${sequence}`;
    
    return taskName;
  };

  // 处理项目选择变化
  const handleProjectChange = async (value) => {
    const selectedProject = projects.find(project => project.id === value);
    if (selectedProject) {
      form.setFieldsValue({
        project_type: selectedProject.project_type,
        project_level: selectedProject.project_level
      });
      
      // 生成并设置任务名称
      const taskName = generateTaskName(value);
      form.setFieldsValue({ task_name: taskName });
      
      // 获取该项目的评审项目经理信息
      try {
        const projectsResponse = await axios.get('http://localhost:5001/api/evaluation-projects');
        if (projectsResponse.data && Array.isArray(projectsResponse.data)) {
          const project = projectsResponse.data.find(p => p.id === value);
          if (project && project.project_manager_id) {
            // 设置创建人和调研人的默认值为项目的评审项目经理
            form.setFieldsValue({
              creator_id: project.project_manager_id,
              researcher_id: project.project_manager_id
            });
          }
        }
      } catch (error) {
        console.error('获取项目信息失败:', error);
      }
    }
  };

  // 当URL中包含project_id参数时，自动设置关联项目
  useEffect(() => {
    if (projectIdFromUrl && formMounted.current) {
      const projectId = parseInt(projectIdFromUrl);
      if (!isNaN(projectId)) {
        form.setFieldsValue({ project_id: projectId });
        // 触发项目选择变化，更新相关字段
        handleProjectChange(projectId);
      }
    }
  }, [projectIdFromUrl, formMounted, isEditMode, handleProjectChange]);

  // 处理表单提交
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const values = await form.validateFields();
      
      // 实际API请求
      let response;
      if (isEditMode) {
        // 更新现有记录
        response = await axios.put(`http://localhost:5001/api/research-tasks/${taskId}`, values);
        message.success('更新调研任务成功');
      } else {
        // 创建新记录，添加vendor_Status和Benchmarking_Status字段
        const newValues = {
          ...values,
          vendor_Status: 0,
          Benchmarking_Status: 0
        };
        response = await axios.post('http://localhost:5001/api/research-tasks', newValues);
        message.success('创建调研任务成功');
      }
      
      navigate('/project/research');
    } catch (error) {
      console.error('创建调研任务失败:', error);
      message.error('操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 返回列表页面
  const handleBack = () => {
    navigate('/project/research');
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
          返回调研任务列表
        </Button>
        <h1 style={{ color: '#333', margin: 0 }}>
          {isEditMode ? '编辑调研任务' : '新增调研任务'}
        </h1>
      </div>
      
      <div style={{ backgroundColor: '#fff', padding: 24, borderRadius: 8 }}>
        <Form
          form={form}
          layout="horizontal"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          onMounted={() => { formMounted.current = true; }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="project_id"
                label="关联项目"
                rules={[{ required: true, message: '请选择关联项目' }]}
              >
                <Select 
                  placeholder="请选择关联项目"
                  onChange={handleProjectChange}
                >
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
                rules={[{ required: true, message: '请输入任务名称' }]}
              >
                <Input 
                  placeholder="请输入任务名称" 
                  onChange={(e) => {
                    const taskName = e.target.value;
                    if (taskName && taskName.trim() !== '') {
                      // 任务名称变化且不为空时，设置默认值
                      const defaultUserId = user && user.id ? user.id : 1;
                      form.setFieldsValue({ 
                        creator_id: defaultUserId,
                        researcher_id: defaultUserId,
                        task_status: '进度中'
                      });
                      
                      // 设置计划完成时间为当前时间+10个工作日
                      const calculateDefaultCompletionTime = () => {
                        const date = new Date();
                        let workdaysAdded = 0;
                        
                        while (workdaysAdded < 10) {
                          date.setDate(date.getDate() + 1);
                          // 跳过周末
                          if (date.getDay() !== 0 && date.getDay() !== 6) {
                            workdaysAdded++;
                          }
                        }
                        
                        form.setFieldsValue({ planned_completion_time: date });
                      };
                      
                      calculateDefaultCompletionTime();
                    }
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="project_type"
                label="项目类型"
                rules={[{ required: true, message: '请选择项目类型' }]}
              >
                <Select placeholder="请选择项目类型" disabled>
                  {evaluationTypes.map(type => (
                    <Option key={type.id} value={type.id}>{type.evaluation_type}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="project_level"
                label="项目级别"
                rules={[{ required: true, message: '请选择项目级别' }]}
              >
                <Select placeholder="请选择项目级别" disabled>
                  {evaluationLevels.map(level => (
                    <Option key={level.id} value={level.id}>{level.evaluation_level}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="creator_id"
                label="创建人"
                rules={[{ required: true, message: '请选择创建人' }]}
              >
                <Select 
                  placeholder="请选择创建人"
                >
                  {users.map(user => (
                    <Option key={user.id} value={user.id}>{user.name}</Option>
                  ))}
                </Select>
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
                name="task_status"
                label="任务状态"
                rules={[{ required: true, message: '请选择任务状态' }]}
              >
                <Select placeholder="请选择任务状态">
                  <Option value="进度中">进度中</Option>
                  <Option value="已完成">已完成</Option>
                  <Option value="超时">超时</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="planned_completion_time"
                label="计划完成时间"
                rules={[{ required: true, message: '请选择计划完成时间' }]}
              >
                <DatePicker style={{ width: '100%' }} />
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
                {isEditMode ? '更新' : '保存'}
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

export default ProjectResearchForm;