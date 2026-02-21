import { useState, useEffect } from 'react';
import { Card, Radio, Divider, ColorPicker, Button, message, List, Typography } from 'antd';
import { SaveOutlined, EditOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;

const SystemSkin = () => {
  const [skins, setSkins] = useState([]);
  const [selectedSkin, setSelectedSkin] = useState(null);
  const [customColor, setCustomColor] = useState('#1890ff');
  const [loading, setLoading] = useState(false);

  // 获取皮肤列表
  const fetchSkins = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/skins');
      setSkins(response.data);
      // 设置默认选中的皮肤
      const defaultSkin = response.data.find(skin => skin.is_default);
      if (defaultSkin) {
        setSelectedSkin(defaultSkin);
        const config = JSON.parse(defaultSkin.config);
        setCustomColor(config.primaryColor || '#1890ff');
      }
    } catch (error) {
      message.error('获取皮肤失败');
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchSkins();
      // 清理多余的自定义皮肤，只保留4个
      await cleanupCustomSkins();
    };
    init();
  }, []);

  // 皮肤配置状态
  const [skinConfig, setSkinConfig] = useState({
    primaryColor: '#1890ff',
    headerColor: '#1890ff',
    sidebarColor: '#fff',
    sidebarTextColor: '#333',
    contentBgColor: '#f0f2f5',
    textColor: '#333',
    buttonColor: '#1890ff',
    fontFamily: 'system-ui, Avenir, Helvetica, Arial, sans-serif'
  });

  // 当自定义颜色变化时，更新皮肤配置
  useEffect(() => {
    setSkinConfig(prev => ({
      ...prev,
      primaryColor: customColor,
      headerColor: customColor,
      buttonColor: customColor
    }));
  }, [customColor]);

  // 保存自定义皮肤
  const handleSaveCustomSkin = async () => {
    setLoading(true);
    try {
      console.log('保存自定义皮肤:', skinConfig);
      
      // 检查现有自定义皮肤数量
      const customSkins = skins.filter(skin => skin.type === 'custom');
      console.log('现有自定义皮肤数量:', customSkins.length);
      
      // 如果超过4个，删除最早的一个
      if (customSkins.length >= 4) {
        // 按ID排序，假设ID小的是最早创建的
        const oldestSkin = [...customSkins].sort((a, b) => a.id - b.id)[0];
        console.log('删除最早的自定义皮肤:', oldestSkin.id);
        await axios.delete(`http://localhost:5001/api/skins/${oldestSkin.id}`);
        message.info('已删除最早的自定义皮肤');
      }
      
      // 实现保存自定义皮肤的逻辑
      // 创建新的自定义皮肤
      const customSkinData = {
        name: '自定义皮肤',
        type: 'custom',
        config: JSON.stringify(skinConfig),
        is_default: false
      };
      
      // 发送请求保存皮肤
      const response = await axios.post('http://localhost:5001/api/skins', customSkinData);
      console.log('皮肤保存响应:', response.data);
      
      message.success('皮肤保存成功');
      // 保存皮肤配置到localStorage
      localStorage.setItem('primaryColor', skinConfig.primaryColor);
      localStorage.setItem('skinConfig', JSON.stringify(skinConfig));
      console.log('皮肤配置已保存到localStorage');
      // 重新获取皮肤列表
      await fetchSkins();
      console.log('皮肤列表已更新');
      // 应用新的皮肤配置
      applySkinConfig(skinConfig);
      console.log('皮肤配置已应用');
      // 触发localStorage变化事件，通知其他组件
      window.dispatchEvent(new Event('storage'));
      console.log('触发localStorage变化事件');
    } catch (error) {
      message.error('皮肤保存失败');
      console.error('保存皮肤出错:', error);
    } finally {
      setLoading(false);
    }
  };

  // 应用皮肤配置
  const applySkinConfig = (config) => {
    console.log('应用皮肤配置:', config);
    // 设置CSS变量
    document.documentElement.style.setProperty('--primary-color', config.primaryColor);
    document.documentElement.style.setProperty('--header-color', config.headerColor);
    document.documentElement.style.setProperty('--sidebar-color', config.sidebarColor);
    document.documentElement.style.setProperty('--sidebar-text-color', config.sidebarTextColor);
    document.documentElement.style.setProperty('--content-bg-color', config.contentBgColor);
    document.documentElement.style.setProperty('--text-color', config.textColor);
    document.documentElement.style.setProperty('--button-color', config.buttonColor);
    document.documentElement.style.setProperty('--font-family', config.fontFamily);
    // 直接更新页面元素样式，确保即时生效
    document.body.style.fontFamily = config.fontFamily;
    document.body.style.color = config.textColor;
    // 强制页面重绘
    setTimeout(() => {
      document.body.style.display = 'none';
      document.body.offsetHeight; // 触发重绘
      document.body.style.display = '';
    }, 0);
  };

  // 清理多余的自定义皮肤，只保留4个
  const cleanupCustomSkins = async () => {
    try {
      // 获取所有自定义皮肤
      const customSkins = skins.filter(skin => skin.type === 'custom');
      console.log('清理前自定义皮肤数量:', customSkins.length);
      
      // 如果超过4个，删除多余的
      if (customSkins.length > 4) {
        // 按ID排序，假设ID小的是最早创建的
        const sortedSkins = [...customSkins].sort((a, b) => a.id - b.id);
        // 计算需要删除的皮肤数量
        const skinsToDelete = sortedSkins.slice(0, customSkins.length - 4);
        
        // 删除多余的皮肤
        for (const skin of skinsToDelete) {
          console.log('删除多余的自定义皮肤:', skin.id);
          await axios.delete(`http://localhost:5001/api/skins/${skin.id}`);
        }
        
        if (skinsToDelete.length > 0) {
          message.success(`已清理 ${skinsToDelete.length} 个多余的自定义皮肤`);
          // 重新获取皮肤列表
          await fetchSkins();
        }
      }
    } catch (error) {
      console.error('清理自定义皮肤出错:', error);
    }
  };

  // 选择皮肤
  const handleSkinSelect = (skin) => {
    setSelectedSkin(skin);
    if (skin.config) {
      const config = JSON.parse(skin.config);
      const color = config.primaryColor || '#1890ff';
      setCustomColor(color);
      setSkinConfig(config);
      // 保存皮肤配置到localStorage
      localStorage.setItem('primaryColor', color);
      localStorage.setItem('skinConfig', JSON.stringify(config));
      // 应用新的皮肤配置
      applySkinConfig(config);
      // 触发localStorage变化事件，通知其他组件
      window.dispatchEvent(new Event('storage'));
    }
  };

  // 皮肤模板选项
  const skinTemplates = [
    { id: 1, name: '默认蓝色', color: '#1890ff' },
    { id: 2, name: '活力橙色', color: '#fa8c16' },
    { id: 3, name: '优雅紫色', color: '#722ed1' },
    { id: 4, name: '清新绿色', color: '#52c41a' },
    { id: 5, name: '沉稳深蓝', color: '#13c2c2' },
    { id: 6, name: '热情红色', color: '#f5222d' },
    { id: 7, name: '温馨粉色', color: '#eb2f96' },
    { id: 8, name: '明亮黄色', color: '#faad14' },
  ];

  // 预设皮肤配置
  const presetSkins = [
    {
      name: '默认蓝色',
      config: {
        primaryColor: '#1890ff',
        headerColor: '#1890ff',
        sidebarColor: '#fff',
        sidebarTextColor: '#333',
        contentBgColor: '#f0f2f5',
        textColor: '#333',
        buttonColor: '#1890ff',
        fontFamily: 'system-ui, Avenir, Helvetica, Arial, sans-serif'
      }
    },
    {
      name: '活力橙色',
      config: {
        primaryColor: '#fa8c16',
        headerColor: '#fa8c16',
        sidebarColor: '#fff',
        sidebarTextColor: '#333',
        contentBgColor: '#fff7e6',
        textColor: '#333',
        buttonColor: '#fa8c16',
        fontFamily: 'system-ui, Avenir, Helvetica, Arial, sans-serif'
      }
    },
    {
      name: '优雅紫色',
      config: {
        primaryColor: '#722ed1',
        headerColor: '#722ed1',
        sidebarColor: '#fff',
        sidebarTextColor: '#333',
        contentBgColor: '#f9f0ff',
        textColor: '#333',
        buttonColor: '#722ed1',
        fontFamily: 'system-ui, Avenir, Helvetica, Arial, sans-serif'
      }
    },
    {
      name: '清新绿色',
      config: {
        primaryColor: '#52c41a',
        headerColor: '#52c41a',
        sidebarColor: '#fff',
        sidebarTextColor: '#333',
        contentBgColor: '#f6ffed',
        textColor: '#333',
        buttonColor: '#52c41a',
        fontFamily: 'system-ui, Avenir, Helvetica, Arial, sans-serif'
      }
    }
  ];

  return (
    <div>
      <h2>系统皮肤</h2>
      


      <Card style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 24 }}>
          <h4>系统预设模板</h4>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 16 }}>
            {presetSkins.map((preset, index) => (
              <div key={index} style={{ flex: '0 0 calc(25% - 12px)', minWidth: 200 }}>
                <Card
                  hoverable
                  style={{ 
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    borderColor: skinConfig.primaryColor === preset.config.primaryColor ? '#1890ff' : '#d9d9d9',
                    borderWidth: skinConfig.primaryColor === preset.config.primaryColor ? 2 : 1
                  }}
                  onClick={() => {
                    setCustomColor(preset.config.primaryColor);
                    setSkinConfig(preset.config);
                    // 保存皮肤配置到localStorage
                    localStorage.setItem('primaryColor', preset.config.primaryColor);
                    localStorage.setItem('skinConfig', JSON.stringify(preset.config));
                    // 应用新的皮肤配置
                    applySkinConfig(preset.config);
                    // 触发localStorage变化事件，通知其他组件
                    window.dispatchEvent(new Event('storage'));
                  }}
                >
                  <div style={{ marginBottom: 8, fontWeight: 'bold' }}>{preset.name}</div>
                  <div style={{ 
                    width: '100%', 
                    height: 30, 
                    backgroundColor: preset.config.primaryColor,
                    borderRadius: 4,
                    marginBottom: 8
                  }} />
                  <div style={{ fontSize: 12, color: '#666' }}>点击应用</div>
                </Card>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4>自定义皮肤</h4>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 16 }}>
            {skins.map(skin => (
              <div key={skin.id} style={{ flex: '0 0 calc(25% - 12px)', minWidth: 200 }}>
                <Card
                  hoverable
                  style={{ 
                    textAlign: 'center',
                    borderColor: selectedSkin?.id === skin.id ? '#1890ff' : '#d9d9d9',
                    borderWidth: selectedSkin?.id === skin.id ? 2 : 1
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Radio 
                      value={skin.id} 
                      checked={selectedSkin?.id === skin.id}
                      onChange={(e) => handleSkinSelect(skins.find(s => s.id === e.target.value))}
                    >
                      {skin.name}
                    </Radio>
                    {skin.type === 'custom' && (
                      <Button 
                        type="text" 
                        danger 
                        size="small"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await axios.delete(`http://localhost:5001/api/skins/${skin.id}`);
                            message.success('皮肤删除成功');
                            fetchSkins();
                          } catch (error) {
                            message.error('皮肤删除失败');
                          }
                        }}
                      >
                        删除
                      </Button>
                    )}
                  </div>
                  {skin.config && (
                    <div style={{ 
                      width: '100%', 
                      height: 30, 
                      backgroundColor: JSON.parse(skin.config).primaryColor || '#1890ff',
                      borderRadius: 4,
                      marginBottom: 8
                    }} />
                  )}
                  {skin.is_default && (
                    <div style={{ fontSize: 12, color: '#1890ff' }}>默认</div>
                  )}
                </Card>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card title="自定义皮肤" style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <Title level={5}>主题颜色</Title>
          <ColorPicker 
            value={customColor} 
            onChange={(color) => setCustomColor(color.toHexString())} 
            style={{ marginRight: 16 }}
          />
          <span>{customColor}</span>
        </div>
        
        <Divider>快速选择</Divider>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {skinTemplates.map(template => (
            <div
              key={template.id}
              style={{
                height: 32,
                backgroundColor: template.color,
                borderRadius: 4,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 12,
                boxShadow: customColor === template.color ? '0 0 0 2px #fff, 0 0 0 4px #1890ff' : 'none',
                transition: 'all 0.3s ease',
                border: '1px solid #d9d9d9'
              }}
              onClick={() => setCustomColor(template.color)}
              title={template.name}
            >
              {template.name}
            </div>
          ))}
        </div>
        
        <Divider>高级配置</Divider>
        <div style={{ marginBottom: 24 }}>
          {/* 高级配置改为每行4个选择 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>顶部导航栏颜色</label>
              <ColorPicker 
                value={skinConfig.headerColor} 
                onChange={(color) => setSkinConfig(prev => ({ ...prev, headerColor: color.toHexString() }))} 
                size="small"
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>侧边栏颜色</label>
              <ColorPicker 
                value={skinConfig.sidebarColor} 
                onChange={(color) => setSkinConfig(prev => ({ ...prev, sidebarColor: color.toHexString() }))} 
                size="small"
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>侧边栏文字颜色</label>
              <ColorPicker 
                value={skinConfig.sidebarTextColor} 
                onChange={(color) => setSkinConfig(prev => ({ ...prev, sidebarTextColor: color.toHexString() }))} 
                size="small"
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>内容背景颜色</label>
              <ColorPicker 
                value={skinConfig.contentBgColor} 
                onChange={(color) => setSkinConfig(prev => ({ ...prev, contentBgColor: color.toHexString() }))} 
                size="small"
              />
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>文字颜色</label>
              <ColorPicker 
                value={skinConfig.textColor} 
                onChange={(color) => setSkinConfig(prev => ({ ...prev, textColor: color.toHexString() }))} 
                size="small"
              />
            </div>
            
            <div style={{ gridColumn: 'span 3' }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>字体</label>
              <select 
                value={skinConfig.fontFamily} 
                onChange={(e) => setSkinConfig(prev => ({ ...prev, fontFamily: e.target.value }))}
                style={{ width: '100%', padding: '6px', borderRadius: 4, border: '1px solid #d9d9d9', fontSize: 14 }}
              >
                <option value="system-ui, Avenir, Helvetica, Arial, sans-serif">默认字体</option>
                <option value="'Microsoft YaHei', Arial, sans-serif">微软雅黑</option>
                <option value="'PingFang SC', 'Helvetica Neue', Arial, sans-serif">苹方字体</option>
                <option value="'SimSun', serif">宋体</option>
                <option value="'SimHei', sans-serif">黑体</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* 保存按钮放在右手边 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            type="primary" 
            icon={<SaveOutlined />} 
            onClick={handleSaveCustomSkin}
            loading={loading}
          >
            保存自定义皮肤
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default SystemSkin;
