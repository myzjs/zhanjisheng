import { useState, useEffect } from 'react';
import {
  Table, Button, Input, Popconfirm,
  message, Space, Tabs, Card, Layout
} from 'antd';

const { Content } = Layout;
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined,
  SettingOutlined, DownloadOutlined, UploadOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/auth';

const Research = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  // 状态管理
  const [tasks, setTasks] = useState([]);
  const [vendorResearches, setVendorResearches] = useState([]);
  const [selectedTaskVendors, setSelectedTaskVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [vendorLoading, setVendorLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [projects, setProjects] = useState([]);
  const [systems, setSystems] = useState([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // 获取数据
  useEffect(() => {
    fetchTasks();
    fetchProjects();
    fetchSystems();
    fetchVendorResearches();
    
    // 添加全屏状态监听器
    const handleFullscreenChange = () => {
      const fullscreenElement = document.fullscreenElement || 
                              document.webkitFullscreenElement || 
                              document.mozFullScreenElement || 
                              document.msFullscreenElement;
      setIsFullScreen(!!fullscreenElement);
    };
    
    // 监听所有全屏相关的事件，确保跨浏览器兼容性
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    // 清理函数
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // 获取厂商调研列表
  const fetchVendorResearches = async () => {
    setVendorLoading(true);
    try {
      const response = await axios.get('http://localhost:5001/api/vendor-researches');
      setVendorResearches(response.data);
      return response.data;
    } catch {
      message.error('获取厂商调研失败');
      return [];
    } finally {
      setVendorLoading(false);
    }
  };

  // 处理任务选择
  const handleTaskSelect = (task) => {
    setSelectedTask(task);
    
    // 获取系统字典表中所有记录
    const allSystems = systems || [];
    
    // 获取该任务的现有厂商调研记录
    const existingVendors = vendorResearches.filter(vendor => 
      vendor.task_name === task.task_name
    );
    
    // 检查是否包含了所有系统的调研记录
    const existingSystemIds = existingVendors.map(vendor => vendor.system_id);
    const allSystemIds = allSystems.map(system => system.id);
    const hasAllSystems = allSystemIds.every(systemId => existingSystemIds.includes(systemId));
    
    if (hasAllSystems) {
      // 已有所有系统的调研记录，弹框提醒
      message.info('已生成过厂商问卷，请填写厂商调研问卷');
      // 筛选现有厂商调研
      setSelectedTaskVendors(existingVendors);
      return;
    } else {
      // 弹框提醒，自动生成问卷
      message.info('自动生成厂商问卷，请填写厂商调研问卷！');
      
      // 准备批量创建厂商调研记录的数据
      const vendorResearchData = allSystems.map(system => ({
        research_date: new Date(),
        researcher_id: user?.id || 1,
        project_id: task.project_id || projects[0]?.id || 1,
        task_name: task.task_name,
        system_id: system.id,
        manufacturer: '',
        remarks: ''
      }));
      
      // 批量创建厂商调研记录
      if (vendorResearchData.length > 0) {
        // 先删除现有记录
        const deletePromises = existingVendors.map(vendor => 
          axios.delete(`http://localhost:5001/api/vendor-researches/${vendor.id}`)
            .catch(err => console.error('删除厂商调研失败:', err))
        );
        
        // 等待删除完成后，批量创建新记录
        Promise.all(deletePromises).then(() => {
          // 批量创建新记录
          const createPromises = vendorResearchData.map(data => 
            axios.post('http://localhost:5001/api/vendor-researches', data)
              .catch(err => console.error('创建厂商调研失败:', err))
          );
          
          Promise.all(createPromises).then(() => {
            // 刷新厂商调研列表
            fetchVendorResearches().then(updatedVendors => {
              const filteredVendors = updatedVendors.filter(vendor => 
                vendor.task_name === task.task_name
              );
              setSelectedTaskVendors(filteredVendors);
              message.success(`成功为任务 "${task.task_name}" 创建了 ${vendorResearchData.length} 条厂商调研记录`);
            });
          });
        });
      } else {
        // 如果没有系统字典记录，只筛选现有厂商调研
        setSelectedTaskVendors(existingVendors);
        message.info('没有找到系统字典记录，无法自动创建厂商调研记录');
      }
    }
  };

  // 获取调研任务列表
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5001/api/research-tasks');
      setTasks(response.data);
    } catch {
      message.error('获取调研任务失败');
    } finally {
      setLoading(false);
    }
  };



  // 获取评审项目列表
  const fetchProjects = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/evaluation-projects');
      setProjects(response.data);
    } catch {
      message.error('获取评审项目列表失败');
    }
  };

  // 获取系统字典列表
  const fetchSystems = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/system-dictionaries');
      setSystems(response.data || []);
    } catch {
      message.error('获取系统字典列表失败');
    }
  };

  // 处理下载模版
  const handleDownloadTemplate = () => {
    if (!selectedTask) return;
    
    // 创建CSV格式的模版数据，包含所有字段和默认值
    // 查找第一个项目作为默认项目名称
    const defaultProjectName = projects[0]?.project_name || '';
    
    const csvContent = `调研日期,调研人,项目名称,任务名称,系统名称,制造商,备注
,${user?.name || ''},${defaultProjectName},${selectedTask.task_name},,,
`;
    
    // 创建Blob对象
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // 创建下载链接并触发下载
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `厂商调研模版-${selectedTask.task_name}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    message.success('模版下载成功');
  };

  // 处理导入模版
  const handleImportTemplate = () => {
    if (!selectedTask) return;
    
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
              // 根据项目名称查找项目ID
              let projectId = projects[0]?.id || 1;
              const projectName = values[2];
              if (projectName) {
                const project = projects.find(p => p.project_name === projectName);
                if (project) {
                  projectId = project.id;
                }
              }
              
              // 根据系统名称查找系统ID
              let systemId = null;
              const systemName = values[4];
              if (systemName) {
                const system = systems.find(s => s.system_name === systemName);
                if (system) {
                  systemId = system.id;
                }
              }
              
              const record = {
                research_date: values[0] ? new Date(values[0]) : new Date(),
                researcher_id: user?.id || 1,
                project_id: projectId,
                task_name: selectedTask.task_name,
                system_id: systemId,
                manufacturer: values[5],
                remarks: values[6],
                system_name: systemName // 保存系统名称，用于后续处理
              };
              importData.push(record);
            }
          }
          
          // 处理系统名称，确保所有系统都存在
          for (const record of importData) {
            if (record.system_name && !record.system_id) {
              try {
                // 再次查找系统，确保最新数据
                const updatedSystems = await axios.get('http://localhost:5001/api/system-dictionaries');
                const systemList = updatedSystems.data || [];
                let system = systemList.find(s => s.system_name === record.system_name);
                
                if (!system) {
                  // 如果没有找到匹配的系统，尝试创建新的系统记录
                  const newSystemResponse = await axios.post('http://localhost:5001/api/system-dictionaries', {
                    system_name: record.system_name,
                    remarks: '导入模板自动创建',
                    enabled_status: 1
                  });
                  system = newSystemResponse.data;
                }
                
                record.system_id = system.id;
              } catch (error) {
                console.error('处理系统失败:', error);
              }
            }
          }
          
          // 批量导入数据
          let updateCount = 0;
          let addCount = 0;
          
          for (const data of importData) {
            try {
              // 移除临时字段，确保只发送需要的字段
              const vendorData = { ...data };
              delete vendorData.system_name;
              
              // 查找是否存在相同系统ID和任务名称的记录
              const existingRecord = vendorResearches.find(v => 
                v.system_id === vendorData.system_id && 
                v.task_name === vendorData.task_name
              );
              
              if (existingRecord) {
                // 更新现有记录
                await axios.put(`http://localhost:5001/api/vendor-researches/${existingRecord.id}`, vendorData);
                updateCount++;
              } else {
                // 添加新记录
                await axios.post('http://localhost:5001/api/vendor-researches', vendorData);
                addCount++;
              }
            } catch (error) {
              console.error('处理记录失败:', error);
              // 继续处理下一条记录
            }
          }
          
          // 刷新系统列表，确保下次导入时能找到新创建的系统
          await fetchSystems();
          
          message.success(`成功导入 ${addCount} 条记录，更新 ${updateCount} 条记录`);
          
          // 刷新列表
          const updatedVendors = await fetchVendorResearches();
          
          // 如果当前有选中的任务，重新筛选该任务相关的厂商调研
          if (selectedTask) {
            const filteredVendors = updatedVendors.filter(vendor => 
              vendor.task_name === selectedTask.task_name
            );
            setSelectedTaskVendors(filteredVendors);
          }
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

  // 批量删除厂商调研记录
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.info('请先选择要删除的记录');
      return;
    }
    
    try {
      // 批量删除选中的记录
      const deletePromises = selectedRowKeys.map(id => 
        axios.delete(`http://localhost:5001/api/vendor-researches/${id}`)
          .catch(err => console.error('删除厂商调研失败:', err))
      );
      
      await Promise.all(deletePromises);
      message.success(`成功删除 ${selectedRowKeys.length} 条记录`);
      
      // 清空选中状态
      setSelectedRowKeys([]);
      
      // 刷新列表
      const updatedVendors = await fetchVendorResearches();
      
      // 如果当前有选中的任务，重新筛选该任务相关的厂商调研
      if (selectedTask) {
        const filteredVendors = updatedVendors.filter(vendor => 
          vendor.task_name === selectedTask.task_name
        );
        setSelectedTaskVendors(filteredVendors);
      }
    } catch (error) {
      message.error('批量删除失败，请重试');
      console.error('Error batch deleting vendor researches:', error);
    }
  };



  // 打开添加调研任务页面
  const handleAdd = () => {
    navigate('/project/research-form');
  };

  // 打开编辑调研任务页面
  const handleEdit = (task) => {
    navigate(`/project/research-form?id=${task.id}`);
  };

  // 删除调研任务
  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5001/api/research-tasks/${id}`);
      message.success('删除调研任务成功');
      // 刷新任务列表
      fetchTasks();
      // 刷新厂商调研列表
      fetchVendorResearches();
      // 清空选中的任务
      setSelectedTask(null);
      setSelectedTaskVendors([]);
    } catch {
      message.error('删除失败，请重试');
    }
  };

  // 更新厂商调研记录
  const updateVendorResearch = async (id, updates) => {
    try {
      // 发送API请求更新记录
      await axios.put(`http://localhost:5001/api/vendor-researches/${id}`, updates);
      // 更新状态
      setVendorResearches(prev => 
        prev.map(research => 
          research.id === id ? { ...research, ...updates } : research
        )
      );
      // 如果当前有选中的任务，更新selectedTaskVendors
      if (selectedTask) {
        setSelectedTaskVendors(prev => 
          prev.map(research => 
            research.id === id ? { ...research, ...updates } : research
          )
        );
      }
    } catch (err) {
      console.error('更新厂商调研失败:', err);
      message.error('更新失败，请重试');
    }
  };

  // 调研任务列定义
  const taskColumns = [
    {
      title: '调研任务',
      dataIndex: 'task_name',
      key: 'task_name',
      width: 200,
    },
    {
      title: '项目类型',
      dataIndex: 'project_type_name',
      key: 'project_type_name',
      width: 150,
    },
    {
      title: '项目级别',
      dataIndex: 'project_level_name',
      key: 'project_level_name',
      width: 120,
    },
    {
      title: '评级项目',
      dataIndex: 'project_name',
      key: 'project_name',
      width: 200,
    },
    {
      title: '创建人',
      dataIndex: 'creator_name',
      key: 'creator_name',
      width: 120,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text) => {
        if (!text) return '-';
        const date = new Date(text);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      },
    },
    {
      title: '任务状态',
      dataIndex: 'task_status',
      key: 'task_status',
      width: 100,
    },
    {
      title: '计划完成时间',
      dataIndex: 'planned_completion_time',
      key: 'planned_completion_time',
      width: 180,
      render: (text) => {
        if (!text) return '-';
        const date = new Date(text);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      },
    },
    {
      title: '调研人',
      dataIndex: 'researcher_name',
      key: 'researcher_name',
      width: 120,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="middle">
          <Button 
            icon={<EditOutlined />} 
            size="small" 
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button 
            icon={<SettingOutlined />} 
            size="small" 
            onClick={() => handleTaskSelect(record)}
          >
            厂商调研
          </Button>
          <Popconfirm
            title="确定要删除这个调研任务吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              icon={<DeleteOutlined />} 
              size="small" 
              danger
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 厂商调研列定义
  const vendorColumns = [
    {
      title: '调研日期',
      dataIndex: 'research_date',
      key: 'research_date',
      width: 120,
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
      render: (text, record) => (
        <Input 
          defaultValue={text || ''} 
          onChange={(e) => {
            const systemName = e.target.value;
            // 查找或创建系统
            let systemId = null;
            const system = systems.find(s => s.system_name === systemName);
            if (system) {
              systemId = system.id;
            } else {
              // 创建新系统
              axios.post('http://localhost:5001/api/system-dictionaries', {
                system_name: systemName,
                remarks: '自动创建',
                enabled_status: 1
              }).then(response => {
                systemId = response.data.id;
                // 更新厂商调研记录
                updateVendorResearch(record.id, { system_id: systemId });
              }).catch(error => {
                console.error('创建系统失败:', error);
              });
            }
            // 更新厂商调研记录
            updateVendorResearch(record.id, { system_name: systemName, system_id: systemId });
          }} 
          style={{ width: '100%' }} 
          allowClear
        />
      ),
    },
    {
      title: '制造商',
      dataIndex: 'manufacturer',
      key: 'manufacturer',
      width: 150,
      render: (text, record) => (
        <Input 
          defaultValue={text || ''} 
          onChange={(e) => updateVendorResearch(record.id, { manufacturer: e.target.value })} 
          style={{ width: '100%' }} 
          allowClear
        />
      ),
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      ellipsis: true,
      render: (text, record) => (
        <Input 
          defaultValue={text || ''} 
          onChange={(e) => updateVendorResearch(record.id, { remarks: e.target.value })} 
          style={{ width: '100%' }} 
          allowClear
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record, index) => {
        // 检查是否是最后一行（在任何状态下，最后一行都显示新增按钮）
        // 由于表格已经设置为不分页，只需要检查是否是完整列表的最后一行
        const isLastRow = index === selectedTaskVendors.length - 1;
        
        // 删除记录的函数
        const handleDelete = () => {
          // 发送API请求删除记录
          axios.delete(`http://localhost:5001/api/vendor-researches/${record.id}`)
            .then(() => {
              // 刷新列表
              fetchVendorResearches().then(updatedVendors => {
                if (selectedTask) {
                  const filteredVendors = updatedVendors.filter(vendor => 
                    vendor.task_name === selectedTask.task_name
                  );
                  setSelectedTaskVendors(filteredVendors);
                }
                message.success('删除厂商调研成功');
              });
            })
            .catch(err => {
              console.error('删除厂商调研失败:', err);
              message.error('删除失败，请重试');
            });
        };
        
        // 添加新记录的函数
        const handleAdd = () => {
          // 获取最后一条记录作为参考
          const lastRecord = selectedTaskVendors.length > 0 ? selectedTaskVendors[selectedTaskVendors.length - 1] : null;
          
          // 添加新记录，使用最后一条记录的值作为默认值
          const newRecord = {
            research_date: lastRecord?.research_date || new Date(),
            researcher_id: lastRecord?.researcher_id || user?.id || 1,
            project_id: lastRecord?.project_id || projects[0]?.id || 1,
            task_name: selectedTask.task_name,
            system_id: null,
            manufacturer: '',
            remarks: ''
          };
          // 发送API请求创建新记录
          axios.post('http://localhost:5001/api/vendor-researches', newRecord)
            .then(() => {
              // 刷新列表
              fetchVendorResearches().then(updatedVendors => {
                if (selectedTask) {
                  const filteredVendors = updatedVendors.filter(vendor => 
                    vendor.task_name === selectedTask.task_name
                  );
                  setSelectedTaskVendors(filteredVendors);
                }
                message.success('新增厂商调研成功');
              });
            })
            .catch(err => {
              console.error('新增厂商调研失败:', err);
              message.error('新增失败，请重试');
            });
        };
        
        // 直接处理删除确认
        const confirmDelete = () => {
          if (window.confirm('确定要删除这条记录吗？删除后将无法恢复')) {
            handleDelete();
          }
        };
        
        return (
          <Space size="middle">
            {isLastRow ? (
              <Button 
                size="small" 
                icon={<PlusOutlined />}
                onClick={handleAdd}
              >
                新增
              </Button>
            ) : (
              <Button 
                size="small" 
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  confirmDelete();
                }}
              >
                删除
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ padding: 24, minHeight: '400px', backgroundColor: '#f5f5f5' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ color: '#333', margin: 0 }}>调研任务管理</h1>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '80vh' }}>
        {/* 区域1：公告区域（红框，2行） */}
        <div style={{ flex: 0.15, backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: 8, padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ff9800', marginRight: 8 }}></div>
            <h3 style={{ color: '#856404', margin: 0, fontSize: 14 }}>公告</h3>
          </div>
          <div style={{ color: '#856404', lineHeight: '1.3', fontSize: 12 }}>
            <p style={{ margin: 0, marginBottom: 4 }}>各位评审专家：</p>
            <p style={{ margin: 0, marginBottom: 4 }}>为确保厂商调研工作的顺利进行，请在开展调研前仔细阅读相关标准和要求，确保调研数据的准确性和完整性。</p>
            <p style={{ margin: 0 }}>如有任何疑问，请及时联系项目管理员。</p>
          </div>
        </div>
        
        {/* 区域2：调研任务列表（绿框，4行） */}
        <div style={{ flex: 0.3, backgroundColor: '#e8f5e8', padding: 12, borderRadius: 8, overflow: 'auto' }}>
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center' }}>
            <Button type="primary" icon={<PlusOutlined />} size="small" onClick={handleAdd}>
              新增调研任务
            </Button>
            <Button 
              icon={<ReloadOutlined />} 
              size="small"
              onClick={fetchTasks} 
              loading={loading}
              style={{ marginLeft: 8 }}
            >
              刷新
            </Button>
          </div>
          
          <Table
            columns={taskColumns}
            dataSource={tasks}
            rowKey="id"
            loading={loading}
            pagination={false}
            size="small"
            scroll={{ x: 1200, y: 'calc(100% - 80px)' }}
            rowSelection={{
              type: 'radio',
              selectedRowKeys: selectedTask ? [selectedTask.id] : [],
              onChange: (selectedRowKeys, selectedRows) => {
                if (selectedRows.length > 0) {
                  handleTaskSelect(selectedRows[0]);
                }
              }
            }}
            rowStyle={{ padding: 8, margin: 0, lineHeight: '1.2' }}
          />
        </div>
        
        {/* 区域3：厂商调研内嵌展示区域（黄框，剩余部分） */}
        <div className="vendor-research-area" style={{ flex: 0.55, backgroundColor: '#fff', padding: 12, borderRadius: 8, overflow: 'auto' }}>
          {selectedTask ? (
            <>
              <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 14 }}>厂商调研 - {selectedTask.task_name} ({selectedTaskVendors.length}条记录)</h3>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Popconfirm
                    title={`确定要删除选中的 ${selectedRowKeys.length} 条记录吗？`}
                    description="删除后将无法恢复"
                    onConfirm={handleBatchDelete}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button 
                      icon={<DeleteOutlined />} 
                      size="small"
                      danger
                      disabled={selectedRowKeys.length === 0}
                    >
                      删除
                    </Button>
                  </Popconfirm>
                  <Button 
                    icon={<DownloadOutlined />} 
                    size="small"
                    onClick={handleDownloadTemplate}
                  >
                    下载模版
                  </Button>
                  <Button 
                    icon={<UploadOutlined />} 
                    size="small"
                    onClick={handleImportTemplate}
                  >
                    导入模版
                  </Button>
                  <Button 
                    size="small"
                    onClick={() => {
                      // 切换全屏模式
                      const vendorResearchArea = document.querySelector('.vendor-research-area');
                      if (vendorResearchArea) {
                        if (!document.fullscreenElement) {
                          vendorResearchArea.requestFullscreen().catch(err => {
                            console.error(`全屏错误: ${err.message}`);
                          });
                        } else {
                          if (document.exitFullscreen) {
                            document.exitFullscreen();
                          }
                        }
                      }
                    }}
                  >
                    {isFullScreen ? '恢复' : '全屏'}
                  </Button>

                </div>
              </div>
              <Table
                columns={vendorColumns}
                dataSource={selectedTaskVendors}
                rowKey="id"
                loading={vendorLoading}
                pagination={false}
                size="small"
                scroll={{ 
                  x: 1000, 
                  y: isFullScreen ? '100%' : 'calc(100% - 150px)'
                }}
                locale={{ emptyText: '该任务暂无厂商调研记录' }}
                rowStyle={{ 
                  padding: 0,
                  margin: 0,
                  lineHeight: '1'
                }}
                style={{ 
                  border: 'none',
                  borderRadius: 0
                }}
                rowSelection={{
                  selectedRowKeys,
                  onChange: (keys) => setSelectedRowKeys(keys),
                  selections: [
                    Table.SELECTION_ALL,
                    Table.SELECTION_INVERT,
                    Table.SELECTION_NONE
                  ],
                  preserveSelectedRowKeys: false
                }}
              />
            </>
          ) : (
            <>
              {/* 即使没有选中任务，也显示厂商调研表头 */}
              <div style={{ marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 14 }}>厂商调研</h3>
              </div>
              <Table
                columns={vendorColumns}
                dataSource={[]}
                rowKey="id"
                loading={false}
                pagination={false}
                size="small"
                scroll={{ x: 1000, y: 'calc(100% - 100px)' }}
                locale={{ emptyText: '请选择一个调研任务查看厂商调研记录' }}
                rowStyle={{ padding: 0 }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Research;