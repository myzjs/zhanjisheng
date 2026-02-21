import React, { useEffect, useState } from 'react';
import {
  Form, Input, Select, DatePicker, Button, 
  message, Spin, Table, Popconfirm
} from 'antd';
import {
  SaveOutlined, LeftOutlined, PlusOutlined, EditOutlined, DeleteOutlined, DownloadOutlined, UploadOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../utils/auth';

const { Option } = Select;

const VendorResearchForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const { user } = useAuth();
  
  // 从URL获取任务名称
  const searchParams = new URLSearchParams(location.search);
  const taskName = searchParams.get('task_name') || '常州-1-3-2602-02';
  
  // 状态管理
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [systems, setSystems] = useState([]);
  const [researchTasks, setResearchTasks] = useState([]);
  const [vendorResearches, setVendorResearches] = useState([]);
  const [editingKey, setEditingKey] = useState(null);
  const [form] = Form.useForm();
  
  // 获取数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 获取用户列表
        const usersResponse = await axios.get('http://localhost:5001/api/users');
        setUsers(usersResponse.data || []);
        
        // 获取评审项目列表
        const projectsResponse = await axios.get('http://localhost:5001/api/evaluation-projects');
        setProjects(projectsResponse.data || []);
        
        // 获取系统字典列表
        const systemsResponse = await axios.get('http://localhost:5001/api/system-dictionaries');
        setSystems(systemsResponse.data || []);
        
        // 获取调研任务列表
        const tasksResponse = await axios.get('http://localhost:5001/api/research-tasks');
        setResearchTasks(tasksResponse.data || []);
        
        // 获取厂商调研列表
        const researchesResponse = await axios.get('http://localhost:5001/api/vendor-researches');
        let filteredResearches = researchesResponse.data || [];
        
        // 如果存在任务名称参数，根据任务名称筛选
        if (taskName) {
          filteredResearches = filteredResearches.filter(
            research => research.task_name === taskName
          );
        }
        
        setVendorResearches(filteredResearches);
      } catch (error) {
        console.error('获取数据失败:', error);
        message.error('获取数据失败');
      } finally {
        setDataLoading(false);
      }
    };
    
    fetchData();
  }, [taskName]);

  // 处理新增
  const handleAdd = () => {
    navigate(`/project/vendor-research-edit?mode=add&task_name=${taskName}`);
  };

  // 处理编辑
  const handleEdit = (record) => {
    navigate(`/project/vendor-research-edit?mode=edit&id=${record.id}&task_name=${taskName}`);
  };

  // 处理删除
  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5001/api/vendor-researches/${id}`);
      message.success('删除厂商调研成功');
      
      // 刷新列表
      const researchesResponse = await axios.get('http://localhost:5001/api/vendor-researches');
      let filteredResearches = researchesResponse.data || [];
      
      // 如果存在任务名称参数，根据任务名称筛选
      if (taskName) {
        filteredResearches = filteredResearches.filter(
          research => research.task_name === taskName
        );
      }
      
      setVendorResearches(filteredResearches);
    } catch (error) {
      console.error('删除失败:', error);
      message.error('删除失败，请重试');
    }
  };

  // 处理下载模版
  const handleDownloadTemplate = () => {
    // 创建CSV格式的模版数据，包含所有字段和默认值
    const csvContent = `调研日期,调研人,项目名称,任务名称,系统名称,制造商,备注
,${user?.name || ''},,,${taskName},,
`;
    
    // 创建Blob对象
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // 创建下载链接并触发下载
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `厂商调研模版-${taskName}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    message.success('模版下载成功');
  };

  // 处理导入模版
  const handleImportTemplate = () => {
    // 创建文件输入元素
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    
    // 监听文件选择
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const csvContent = event.target.result;
          const lines = csvContent.split('\n');
          
          // 解析CSV数据
          const importData = [];
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length >= 7) {
              const record = {
                research_date: values[0] ? new Date(values[0]) : new Date(),
                researcher_id: user?.id || 1,
                project_id: projects[0]?.id || 1,
                task_name: values[3] || taskName,
                system_id: systems[0]?.id || null,
                manufacturer: values[5],
                remarks: values[6]
              };
              importData.push(record);
            }
          }
          
          // 批量导入数据
          let updateCount = 0;
          let addCount = 0;
          
          for (const data of importData) {
            try {
              // 由于导入的记录可能没有系统ID，我们直接添加新记录
              // 这样可以确保所有导入的记录都能被正确添加
              await axios.post('http://localhost:5001/api/vendor-researches', data);
              addCount++;
            } catch (error) {
              console.error('处理记录失败:', error);
              // 继续处理下一条记录
            }
          }
          
          message.success(`成功导入 ${addCount} 条记录`);
          
          // 刷新列表
          const researchesResponse = await axios.get('http://localhost:5001/api/vendor-researches');
          let filteredResearches = researchesResponse.data || [];
          
          // 如果存在任务名称参数，根据任务名称筛选
          if (taskName) {
            filteredResearches = filteredResearches.filter(
              research => research.task_name === taskName
            );
          }
          
          setVendorResearches(filteredResearches);
        } catch (error) {
          console.error('导入失败:', error);
          message.error('导入失败，请检查文件格式');
        }
      };
      reader.readAsText(file);
    };
    
    // 触发文件选择
    input.click();
  };

  // 列定义
  const columns = [
    {
      title: '调研日期',
      dataIndex: 'research_date',
      key: 'research_date',
      width: 120,
      render: (text) => {
        return text ? new Date(text).toISOString().split('T')[0] : '';
      },
    },
    {
      title: '调研人',
      dataIndex: 'researcher_name',
      key: 'researcher_name',
      width: 120,
    },
    {
      title: '项目名称',
      dataIndex: 'project_name',
      key: 'project_name',
      width: 200,
    },
    {
      title: '任务名称',
      dataIndex: 'task_name',
      key: 'task_name',
      width: 200,
    },
    {
      title: '系统名称',
      dataIndex: 'system_name',
      key: 'system_name',
      width: 150,
    },
    {
      title: '制造商',
      dataIndex: 'manufacturer',
      key: 'manufacturer',
      width: 150,
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button 
            icon={<EditOutlined />} 
            size="small" 
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条记录吗？"
            description="删除后将无法恢复"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              danger 
              icon={<DeleteOutlined />}
              size="small"
            >
              删除
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

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
          onClick={() => navigate('/project/research')}
          style={{ marginBottom: 20 }}
        >
          返回调研任务列表
        </Button>
        <h1 style={{ color: '#333', margin: 0 }}>
          厂商调研管理 - {taskName}
        </h1>
      </div>
      
      <div style={{ backgroundColor: '#fff', padding: 24, borderRadius: 8, marginBottom: 20 }}>
        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: '#333', margin: 0 }}>
            厂商调研列表
          </h2>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleAdd}
            >
              新增厂商调研
            </Button>
            <Button 
              icon={<DownloadOutlined />} 
              onClick={handleDownloadTemplate}
            >
              下载模版
            </Button>
            <Button 
              icon={<UploadOutlined />} 
              onClick={handleImportTemplate}
            >
              导入模版
            </Button>
          </div>
        </div>
        
        <Table
          columns={columns}
          dataSource={vendorResearches}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showQuickJumper: true,
          }}
          scroll={{
            x: 1200,
          }}
        />
      </div>
    </div>
  );
};

export default VendorResearchForm;