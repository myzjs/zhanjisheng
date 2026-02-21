import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Modal, Form, Input, Select, message, 
  Popconfirm, Space, Typography, InputNumber, Upload
} from 'antd';
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const { Option } = Select;
const { Title } = Typography;
const { TextArea } = Input;

const EMRStandardClause = () => {
  const [clauses, setClauses] = useState([]);
  const [standards, setStandards] = useState([]);
  const [workRoles, setWorkRoles] = useState([]);
  const [businessProjects, setBusinessProjects] = useState([]);
  const [functionScores, setFunctionScores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentClause, setCurrentClause] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [standardId, setStandardId] = useState('');
  const [workRole, setWorkRole] = useState('');
  const [businessProject, setBusinessProject] = useState('');
  const [functionScore, setFunctionScore] = useState(null);
  const location = useLocation();

  // 获取评审标准列表
  const fetchStandards = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/evaluation-standards');
      setStandards(response.data);
    } catch (error) {
      message.error('获取评审标准失败');
      console.error('Error fetching standards:', error);
    }
  };

  // 获取工作角色列表
  const fetchWorkRoles = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/emr-standard-clauses/work-roles');
      setWorkRoles(response.data);
    } catch (error) {
      message.error('获取工作角色失败');
      console.error('Error fetching work roles:', error);
    }
  };

  // 获取业务项目列表
  const fetchBusinessProjects = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/emr-standard-clauses/business-projects');
      setBusinessProjects(response.data);
    } catch (error) {
      message.error('获取业务项目失败');
      console.error('Error fetching business projects:', error);
    }
  };

  // 获取功能评分列表
  const fetchFunctionScores = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/emr-standard-clauses/function-scores');
      setFunctionScores(response.data);
    } catch (error) {
      message.error('获取功能评分失败');
      console.error('Error fetching function scores:', error);
    }
  };

  // 获取EMR标准条款列表
  const fetchClauses = async () => {
    setLoading(true);
    try {
      // 构建查询参数
      const params = new URLSearchParams();
      if (standardId) params.append('standard_id', standardId);
      if (workRole) params.append('work_role', workRole);
      if (businessProject) params.append('business_project', businessProject);
      if (functionScore !== null && functionScore !== undefined) params.append('function_score', functionScore);
      
      const url = `http://localhost:5001/api/emr-standard-clauses${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await axios.get(url);
      setClauses(response.data);
    } catch (error) {
      message.error('获取EMR标准条款失败');
      console.error('Error fetching clauses:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始化数据
  useEffect(() => {
    fetchStandards();
    fetchWorkRoles();
    fetchBusinessProjects();
    fetchFunctionScores();
    // 从URL参数中获取standard_id
    const params = new URLSearchParams(location.search);
    const urlStandardId = params.get('standard_id');
    if (urlStandardId) {
      setStandardId(urlStandardId);
    }
  }, []);

  // 当筛选条件变化时，重新获取条款
  useEffect(() => {
    fetchClauses();
  }, [standardId, workRole, businessProject, functionScore]);

  // 打开新增条款模态框
  const showAddModal = () => {
    setCurrentClause(null);
    setIsEditMode(false);
    form.resetFields();
    if (standardId) {
      form.setFieldsValue({ standard_id: standardId });
    }
    setIsModalVisible(true);
  };

  // 打开编辑条款模态框
  const showEditModal = (clause) => {
    setCurrentClause(clause);
    setIsEditMode(true);
    form.setFieldsValue(clause);
    setIsModalVisible(true);
  };

  // 保存条款
  const handleSave = async (values) => {
    try {
      if (isEditMode) {
        // 更新条款
        await axios.put(`http://localhost:5001/api/emr-standard-clauses/${currentClause.id}`, values);
        message.success('EMR标准条款更新成功');
      } else {
        // 创建条款
        await axios.post('http://localhost:5001/api/emr-standard-clauses', values);
        message.success('EMR标准条款创建成功');
      }
      setIsModalVisible(false);
      fetchClauses();
    } catch (error) {
      message.error(isEditMode ? 'EMR标准条款更新失败' : 'EMR标准条款创建失败');
      console.error('Error saving clause:', error);
    }
  };

  // 删除条款
  const handleDelete = async (clauseId) => {
    try {
      await axios.delete(`http://localhost:5001/api/emr-standard-clauses/${clauseId}`);
      message.success('EMR标准条款删除成功');
      fetchClauses();
    } catch (error) {
      message.error('EMR标准条款删除失败');
      console.error('Error deleting clause:', error);
    }
  };

  // 下载模板
  const handleDownloadTemplate = () => {
    // 创建CSV模板内容
    const headers = ['标准ID', '项目代码', '工作角色', '业务项目', '评价类别', '主要评价内容', '功能评分', '数据质量评价内容'];
    const templateRow = [standardId || '', '项目代码示例', '医生', '门诊挂号', '基本', '主要评价内容示例', '85.5', '数据质量评价内容示例'];
    
    // 转换为CSV格式
    const csvContent = [
      headers.join(','),
      templateRow.join(',')
    ].join('\n');
    
    // 创建Blob对象
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    // 生成下载链接
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `emr_standard_clause_template_${standardId || 'all'}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success('模板下载成功');
    }
  };

  // 处理文件上传
  const handleFileUpload = async (file) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const csvContent = e.target.result;
        const lines = csvContent.split('\n');
        
        // 跳过表头，处理数据行
        const dataRows = lines.slice(1).filter(line => line.trim() !== '');
        const clauses = [];
        
        for (const row of dataRows) {
          const values = row.split(',');
          if (values.length >= 7) {
            clauses.push({
              standard_id: values[0] || standardId,
              project_code: values[1],
              work_role: values[2],
              business_project: values[3],
              evaluation_category: values[4] || '基本',
              main_evaluation_content: values[5],
              function_score: values[6] ? parseFloat(values[6]) : null,
              data_quality_evaluation_content: values[7] || ''
            });
          }
        }
        
        // 批量导入数据
        for (const clause of clauses) {
          await axios.post('http://localhost:5001/api/emr-standard-clauses', clause);
        }
        
        message.success(`成功导入 ${clauses.length} 条EMR标准条款`);
        // 强制刷新数据
        await fetchClauses();
      } catch (error) {
        message.error('导入数据失败');
        console.error('Error importing data:', error);
      }
    };
    
    reader.onerror = () => {
      message.error('文件读取失败');
    };
    
    reader.readAsText(file);
  };

  // 列配置
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '标准ID',
      dataIndex: 'standard_id',
      key: 'standard_id',
      width: 120,
    },
    {
      title: '项目代码',
      dataIndex: 'project_code',
      key: 'project_code',
      width: 120,
    },
    {
      title: '工作角色',
      dataIndex: 'work_role',
      key: 'work_role',
      width: 150,
    },
    {
      title: '业务项目',
      dataIndex: 'business_project',
      key: 'business_project',
      width: 150,
    },
    {
      title: '主要评价内容',
      dataIndex: 'main_evaluation_content',
      key: 'main_evaluation_content',
      ellipsis: true,
    },
    {
      title: '评价类别',
      dataIndex: 'evaluation_category',
      key: 'evaluation_category',
      width: 100,
    },
    {
      title: '功能评分',
      dataIndex: 'function_score',
      key: 'function_score',
      width: 100,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <Button type="primary" size="small" onClick={() => showEditModal(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个EMR标准条款吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button danger size="small">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="emr-standard-clause-management">
      <Title level={2}>EMR标准条款管理</Title>
      
      <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* 第一行筛选框 */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Select
            placeholder="选择评审标准"
            style={{ width: 300 }}
            value={standardId}
            onChange={setStandardId}
          >
            <Option value="">全部标准</Option>
            {standards.map(standard => (
              <Option key={standard.standard_id} value={standard.standard_id}>
                {standard.standard_id} - {standard.standard_name}
              </Option>
            ))}
          </Select>
          
          <Select
            placeholder="工作角色"
            style={{ width: 200 }}
            value={workRole || undefined}
            onChange={setWorkRole}
            allowClear
          >
            <Option value="">全选</Option>
            {workRoles.map(role => (
              <Option key={role.value} value={role.value}>
                {role.name}
              </Option>
            ))}
          </Select>
          
          <Select
            placeholder="业务项目"
            style={{ width: 250 }}
            value={businessProject || undefined}
            onChange={setBusinessProject}
            allowClear
          >
            <Option value="">全选</Option>
            {businessProjects.map(project => (
              <Option key={project.value} value={project.value}>
                {project.name}
              </Option>
            ))}
          </Select>
          
          <Select
            placeholder="功能评分"
            style={{ width: 150, textAlign: 'center' }}
            value={functionScore || undefined}
            onChange={setFunctionScore}
            allowClear
          >
            <Option value="" style={{ textAlign: 'center' }}>全选</Option>
            {functionScores.map(score => (
              <Option key={score.value} value={score.value} style={{ textAlign: 'center' }}>
                {score.name}
              </Option>
            ))}
          </Select>
        </div>
        
        {/* 第二行操作按钮 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Upload
            accept=".csv"
            showUploadList={false}
            maxCount={1}
            beforeUpload={(file) => {
              handleFileUpload(file);
              return false; // 阻止默认上传行为
            }}
          >
            <Button icon={<UploadOutlined />}>
              导入数据
            </Button>
          </Upload>
          <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
            下载模板
          </Button>
          <Button type="primary" onClick={showAddModal}>
            新增EMR标准条款
          </Button>
        </div>
      </div>
      
      <Table
        columns={columns}
        dataSource={clauses}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />
      
      <Modal
        title={isEditMode ? '编辑EMR标准条款' : '新增EMR标准条款'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Form.Item
            name="standard_id"
            label="评审标准ID"
            rules={[{ required: true, message: '请选择评审标准' }]}
          >
            <Select placeholder="请选择评审标准">
              {standards.map(standard => (
                <Option key={standard.standard_id} value={standard.standard_id}>
                  {standard.standard_id} - {standard.standard_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="project_code"
            label="项目代码"
            rules={[{ required: true, message: '请输入项目代码' }]}
          >
            <Input placeholder="请输入项目代码" />
          </Form.Item>
          
          <Form.Item
            name="work_role"
            label="工作角色"
            rules={[{ required: true, message: '请选择工作角色' }]}
          >
            <Select placeholder="请选择工作角色">
              {workRoles.map(role => (
                <Option key={role.value} value={role.value}>
                  {role.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="business_project"
            label="业务项目"
            rules={[{ required: true, message: '请选择业务项目' }]}
          >
            <Select placeholder="请选择业务项目">
              {businessProjects.map(project => (
                <Option key={project.value} value={project.value}>
                  {project.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="evaluation_category"
            label="评价类别"
            initialValue="基本"
            rules={[{ required: true, message: '请选择评价类别' }]}
          >
            <Select placeholder="请选择评价类别">
              <Option value="基本">基本</Option>
              <Option value="选择">选择</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="main_evaluation_content"
            label="主要评价内容"
            rules={[{ required: true, message: '请输入主要评价内容' }]}
          >
            <TextArea 
              placeholder="请输入主要评价内容" 
              rows={4} 
              showCount 
              maxLength={1000}
            />
          </Form.Item>
          
          <Form.Item
            name="function_score"
            label="功能评分"
          >
            <Select placeholder="请选择功能评分" allowClear>
              {functionScores.map(score => (
                <Option key={score.value} value={score.value}>
                  {score.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="data_quality_evaluation_content"
            label="数据质量评价内容"
          >
            <TextArea 
              placeholder="请输入数据质量评价内容" 
              rows={3} 
              showCount 
              maxLength={500}
            />
          </Form.Item>
          
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setIsModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {isEditMode ? '保存修改' : '创建条款'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EMRStandardClause;