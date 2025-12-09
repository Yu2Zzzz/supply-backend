// src/pages/MaterialManagementPage.jsx - 增强版（CRUD + 库存分配 + 供应商 + 采购订单）
import React, { memo, useState, useCallback, useEffect } from 'react';
import { Box, Plus, Search, RefreshCw, Edit, Trash2, Save, X, Warehouse, Package, AlertTriangle, CheckCircle, User, TrendingUp, ShoppingCart } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';

// ============ 内置 UI 组件 ============
const Card = memo(({ children, style = {} }) => (
  <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', ...style }}>
    {children}
  </div>
));

const Button = memo(({ children, onClick, variant = 'primary', icon: Icon, size = 'md', disabled = false, style = {} }) => {
  const baseStyle = {
    display: 'inline-flex', alignItems: 'center', gap: '8px', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 600, borderRadius: size === 'sm' ? '8px' : '12px', transition: 'all 0.2s',
    padding: size === 'sm' ? '8px 12px' : '12px 20px', fontSize: size === 'sm' ? '12px' : '14px',
    opacity: disabled ? 0.5 : 1, ...style
  };
  const variants = {
    primary: { background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff' },
    secondary: { background: '#f1f5f9', color: '#374151' },
    danger: { background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: '#fff' },
    success: { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff' },
    warning: { background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#fff' },
    info: { background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', color: '#fff' }
  };
  return <button style={{ ...baseStyle, ...variants[variant] }} onClick={onClick} disabled={disabled}>{Icon && <Icon size={size === 'sm' ? 14 : 18} />}{children}</button>;
});

const Input = memo(({ label, value, onChange, placeholder, type = 'text', required = false, disabled = false }) => (
  <div style={{ marginBottom: '16px' }}>
    {label && <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>{label}{required && <span style={{ color: '#ef4444' }}> *</span>}</label>}
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
      style={{ width: '100%', padding: '12px 14px', fontSize: '14px', border: '2px solid #e2e8f0', borderRadius: '10px', outline: 'none', boxSizing: 'border-box', background: disabled ? '#f8fafc' : '#fff' }} />
  </div>
));

const Modal = memo(({ isOpen, onClose, title, children, width = '500px' }) => {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: width, maxHeight: '90vh', overflow: 'auto', position: 'relative' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '24px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>{title}</h2>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: '10px', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
        </div>
        <div style={{ padding: '0 24px 24px' }}>{children}</div>
      </div>
    </div>
  );
});

const EmptyState = memo(({ icon: Icon, title, description }) => (
  <div style={{ textAlign: 'center', padding: '48px 24px' }}>
    <div style={{ width: '64px', height: '64px', margin: '0 auto 16px', background: '#f1f5f9', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={28} style={{ color: '#94a3b8' }} />
    </div>
    <div style={{ fontSize: '16px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>{title}</div>
    <div style={{ fontSize: '14px', color: '#94a3b8' }}>{description}</div>
  </div>
));

const LoadingScreen = memo(() => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: '48px', height: '48px', margin: '0 auto 16px', border: '4px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <div style={{ color: '#64748b' }}>加载中...</div>
    </div>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
));

// ============ 物料管理页面 - 增强版 ============
const MaterialManagementPage = memo(() => {
  const { request } = useApi();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'purchaser';
  
  const [materials, setMaterials] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedMaterial, setSelectedMaterial] = useState(null); // 选中查看详情的物料
  
  // 物料编辑弹窗
  const [showModal, setShowModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [formData, setFormData] = useState({
    materialCode: '', name: '', spec: '', unit: 'KG', price: 0, safeStock: 100
  });
  
  // 库存分配弹窗
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [inventoryMaterial, setInventoryMaterial] = useState(null);
  const [materialInventories, setMaterialInventories] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [editingInventory, setEditingInventory] = useState(null);
  const [inventoryFormData, setInventoryFormData] = useState({ quantity: 0, safetyStock: 100 });
  
  // ✨ 物料详情数据（供应商、采购订单）
  const [materialSuppliers, setMaterialSuppliers] = useState([]);
  const [materialPOs, setMaterialPOs] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // 获取物料列表
  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    const res = await request(`/api/materials?page=${page}&pageSize=10&keyword=${keyword}`);
    if (res.success) {
      setMaterials(res.data?.list || res.data || []);
      setTotal(res.data?.pagination?.total || 0);
    }
    setLoading(false);
  }, [request, page, keyword]);

  // 获取仓库列表
  const fetchWarehouses = useCallback(async () => {
    const res = await request('/api/warehouses');
    if (res.success) {
      setWarehouses(res.data?.list || res.data || []);
    }
  }, [request]);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);
  useEffect(() => { fetchWarehouses(); }, [fetchWarehouses]);

  // ✨ 查看物料详情（供应商+采购订单）
  const viewMaterialDetail = async (material) => {
    setSelectedMaterial(material);
    setDetailLoading(true);
    
    try {
      // 获取供应商数据
      const suppliersRes = await request('/api/suppliers');
      if (suppliersRes.success) {
        const allSuppliers = suppliersRes.data?.list || suppliersRes.data || [];
        setMaterialSuppliers(allSuppliers);
      } else {
        setMaterialSuppliers([]);
      }
    } catch (error) {
      console.error('获取供应商失败:', error);
      setMaterialSuppliers([]);
    }
    
    try {
      // 获取采购订单数据
      const posRes = await request(`/api/purchase-orders?materialId=${material.id}`);
      if (posRes.success) {
        const pos = posRes.data?.list || posRes.data || [];
        setMaterialPOs(pos);
      } else {
        setMaterialPOs([]);
      }
    } catch (error) {
      console.error('获取采购订单失败:', error);
      setMaterialPOs([]);
    }
    
    setDetailLoading(false);
  };

  // 打开物料编辑弹窗
  const openMaterialModal = (material = null) => {
    setEditingMaterial(material);
    if (material) {
      setFormData({
        materialCode: material.materialCode || material.material_code || '',
        name: material.name || '',
        spec: material.spec || '',
        unit: material.unit || 'KG',
        price: material.price || 0,
        safeStock: material.safeStock || material.safe_stock || 100
      });
    } else {
      setFormData({ materialCode: '', name: '', spec: '', unit: 'KG', price: 0, safeStock: 100 });
    }
    setShowModal(true);
  };

  // 保存物料
  const handleSaveMaterial = async () => {
    if (!formData.materialCode || !formData.name) {
      alert('物料编码和名称不能为空');
      return;
    }
    
    const endpoint = editingMaterial ? `/api/materials/${editingMaterial.id}` : '/api/materials';
    const method = editingMaterial ? 'PUT' : 'POST';
    
    const res = await request(endpoint, { method, body: JSON.stringify(formData) });
    if (res.success) {
      setShowModal(false);
      fetchMaterials();
      alert('保存成功！');
    } else {
      alert(res.message || '保存失败');
    }
  };

  // 删除物料
  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除该物料吗？')) return;
    const res = await request(`/api/materials/${id}`, { method: 'DELETE' });
    if (res.success) {
      fetchMaterials();
      alert('删除成功！');
    } else {
      alert(res.message || '删除失败');
    }
  };

  // ✨ 打开库存分配弹窗
  const openInventoryModal = async (material) => {
    setInventoryMaterial(material);
    setInventoryLoading(true);
    setShowInventoryModal(true);
    setEditingInventory(null);
    
    const res = await request(`/api/inventory?materialId=${material.id}`);
    
    if (res.success) {
      const inventories = res.data?.list || res.data || [];
      
      const fullInventories = warehouses.map(wh => {
        const existing = inventories.find(inv => 
          (inv.warehouseId || inv.warehouse_id) == wh.id
        );
        
        return existing ? {
          id: existing.id,
          warehouseId: wh.id,
          warehouseName: wh.name,
          warehouseCode: wh.warehouseCode || wh.warehouse_code,
          quantity: existing.quantity || 0,
          safetyStock: existing.safetyStock || existing.safety_stock || 100,
          hasInventory: true
        } : {
          id: null,
          warehouseId: wh.id,
          warehouseName: wh.name,
          warehouseCode: wh.warehouseCode || wh.warehouse_code,
          quantity: 0,
          safetyStock: 100,
          hasInventory: false
        };
      });
      
      setMaterialInventories(fullInventories);
    } else {
      setMaterialInventories([]);
    }
    
    setInventoryLoading(false);
  };

  // 编辑库存
  const editWarehouseInventory = (inventory) => {
    setEditingInventory(inventory);
    setInventoryFormData({
      quantity: inventory.quantity || 0,
      safetyStock: inventory.safetyStock || 100
    });
  };

  // 保存库存
  const handleSaveInventory = async () => {
    if (!editingInventory) return;
    
    const inventoryData = {
      materialId: inventoryMaterial.id,
      material_id: inventoryMaterial.id,
      warehouseId: editingInventory.warehouseId,
      warehouse_id: editingInventory.warehouseId,
      quantity: parseFloat(inventoryFormData.quantity) || 0,
      safetyStock: parseInt(inventoryFormData.safetyStock) || 100,
      safety_stock: parseInt(inventoryFormData.safetyStock) || 100
    };
    
    let res;
    if (editingInventory.hasInventory && editingInventory.id) {
      res = await request(`/api/inventory/${editingInventory.id}`, {
        method: 'PUT',
        body: JSON.stringify(inventoryData)
      });
    } else {
      res = await request('/api/inventory', {
        method: 'POST',
        body: JSON.stringify(inventoryData)
      });
    }
    
    if (res.success) {
      setEditingInventory(null);
      openInventoryModal(inventoryMaterial);
      alert('库存保存成功！');
    } else {
      alert(res.message || '保存失败');
    }
  };

  // 添加到新仓库
  const handleAddToWarehouse = async (warehouseId) => {
    const inventoryData = {
      materialId: inventoryMaterial.id,
      material_id: inventoryMaterial.id,
      warehouseId: warehouseId,
      warehouse_id: warehouseId,
      quantity: 0,
      safetyStock: 100,
      safety_stock: 100
    };
    
    const res = await request('/api/inventory', {
      method: 'POST',
      body: JSON.stringify(inventoryData)
    });
    
    if (res.success) {
      openInventoryModal(inventoryMaterial);
      alert('添加成功！可以编辑数量了');
    } else {
      alert(res.message || '添加失败');
    }
  };

  // 计算库存预警状态
  const getInventoryStatus = (quantity, safetyStock) => {
    const ratio = quantity / (safetyStock || 1);
    if (ratio >= 1) return { color: '#10b981', bgColor: '#dcfce7', text: '正常', icon: CheckCircle };
    if (ratio >= 0.5) return { color: '#f59e0b', bgColor: '#fef3c7', text: '库存不足', icon: AlertTriangle };
    return { color: '#ef4444', bgColor: '#fee2e2', text: '严重不足', icon: AlertTriangle };
  };

  if (loading) return <LoadingScreen />;

  // ✨ 如果选中了物料，显示详情页
  if (selectedMaterial) {
    return (
      <div>
        <button onClick={() => setSelectedMaterial(null)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#64748b', marginBottom: '24px', padding: 0 }}>
          <X size={20} /> 返回物料列表
        </button>

        {/* 物料基本信息卡片 */}
        <Card style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>
            {selectedMaterial.name}
          </h1>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginTop: '20px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>物料编码</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{selectedMaterial.materialCode || selectedMaterial.material_code}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>规格</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{selectedMaterial.spec || '-'}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>单位</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{selectedMaterial.unit}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>单价</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#10b981' }}>¥{(Number(selectedMaterial.price) || 0).toFixed(2)}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>当前库存</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#ef4444' }}>{selectedMaterial.stock || 0}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>安全库存</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#3b82f6' }}>{selectedMaterial.safeStock || selectedMaterial.safe_stock || 100}</div>
            </div>
          </div>
        </Card>

        {/* 供应商列表 */}
        <Card style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '20px' }}>供应商</h2>
          {detailLoading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>加载中...</div>
          ) : materialSuppliers.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {materialSuppliers.slice(0, 3).map((supplier, idx) => (
                <div key={idx} style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: idx === 0 ? '2px solid #3b82f6' : '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                        {supplier.name || supplier.supplier_name}
                        {idx === 0 && <span style={{ marginLeft: '8px', padding: '2px 8px', fontSize: '11px', background: '#dbeafe', color: '#3b82f6', borderRadius: '4px', fontWeight: 600 }}>主供应商</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>准时率</div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#10b981' }}>94%</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>质量率</div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#10b981' }}>97%</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>暂无供应商数据</div>
          )}
        </Card>

        {/* 采购订单列表 */}
        <Card>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '20px' }}>采购订单</h2>
          {detailLoading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>加载中...</div>
          ) : materialPOs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {materialPOs.slice(0, 5).map((po, idx) => (
                <div key={idx} style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{po.orderNo || po.order_no}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                        {po.supplierName || po.supplier_name} | {po.quantity} {selectedMaterial.unit}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>预计</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                        {po.expectedDate ? new Date(po.expectedDate).toLocaleDateString('zh-CN') : '-'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>暂无采购订单</div>
          )}
        </Card>
      </div>
    );
  }

  // 主列表视图
  return (
    <div>
      {/* 页面标题 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>物料管理</h1>
          <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>管理原材料和库存分配</p>
        </div>
        {isAdmin && <Button icon={Plus} onClick={() => openMaterialModal()}>新增物料</Button>}
      </div>

      {/* 搜索栏 */}
      <Card style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="搜索物料编码或名称..."
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              style={{ width: '100%', padding: '12px 14px 12px 42px', fontSize: '14px', border: '2px solid #e2e8f0', borderRadius: '10px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <Button variant="secondary" icon={RefreshCw} onClick={fetchMaterials}>刷新</Button>
        </div>
      </Card>

      {/* 物料列表 */}
      <Card>
        {materials.length === 0 ? (
          <EmptyState icon={Box} title="暂无物料" description="点击新增物料按钮添加" />
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>物料编码</th>
                    <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>物料名称</th>
                    <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>规格</th>
                    <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>库存</th>
                    <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>在途</th>
                    <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map(material => (
                    <tr key={material.id} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} onClick={() => viewMaterialDetail(material)}>
                      <td style={{ padding: '16px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                        {material.materialCode || material.material_code}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>{material.name}</td>
                      <td style={{ padding: '16px', fontSize: '13px', color: '#64748b' }}>{material.spec || '-'}</td>
                      <td style={{ padding: '16px', fontSize: '16px', fontWeight: 700, textAlign: 'center', color: (material.stock || 0) < (material.safeStock || material.safe_stock || 100) ? '#ef4444' : '#10b981' }}>
                        {material.stock || 0}
                      </td>
                      <td style={{ padding: '16px', fontSize: '16px', fontWeight: 700, textAlign: 'center', color: '#3b82f6' }}>
                        {material.in_transit || material.inTransit || 0}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          <Button size="sm" variant="info" icon={Warehouse} onClick={() => openInventoryModal(material)}>
                            库存
                          </Button>
                          {isAdmin && (
                            <>
                              <Button size="sm" variant="secondary" icon={Edit} onClick={() => openMaterialModal(material)}>编辑</Button>
                              <Button size="sm" variant="danger" icon={Trash2} onClick={() => handleDelete(material.id)}>删除</Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>共 {total} 条记录</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button size="sm" variant="secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>上一页</Button>
                <span style={{ padding: '8px 12px', fontSize: '14px' }}>第 {page} 页</span>
                <Button size="sm" variant="secondary" onClick={() => setPage(p => p + 1)} disabled={page * 10 >= total}>下一页</Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* 物料编辑弹窗 */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingMaterial ? '编辑物料' : '新增物料'} width="550px">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Input label="物料编码" value={formData.materialCode} onChange={v => setFormData({ ...formData, materialCode: v })} required placeholder="如: M001" />
          <Input label="物料名称" value={formData.name} onChange={v => setFormData({ ...formData, name: v })} required placeholder="如: 钢管" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Input label="规格" value={formData.spec} onChange={v => setFormData({ ...formData, spec: v })} placeholder="如: 20mm x 2m" />
          <Input label="单位" value={formData.unit} onChange={v => setFormData({ ...formData, unit: v })} placeholder="如: KG, M, PCS" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Input label="单价" type="number" value={formData.price} onChange={v => setFormData({ ...formData, price: parseFloat(v) || 0 })} placeholder="0.00" />
          <Input label="安全库存" type="number" value={formData.safeStock} onChange={v => setFormData({ ...formData, safeStock: parseInt(v) || 100 })} placeholder="100" />
        </div>
        
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setShowModal(false)}>取消</Button>
          <Button icon={Save} onClick={handleSaveMaterial}>保存</Button>
        </div>
      </Modal>

      {/* 库存分配弹窗 - 保持原样 */}
      <Modal isOpen={showInventoryModal} onClose={() => {
        setShowInventoryModal(false);
        setEditingInventory(null);
      }} 
        title={`物料库存分配 - ${inventoryMaterial?.name || ''}`} width="750px">
        {inventoryLoading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>加载库存数据...</div>
        ) : (
          <>
            {/* 库存总览等保持原有代码... */}
            <div style={{ marginBottom: '20px', padding: '16px', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', borderRadius: '12px', border: '2px solid #10b981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-around', gap: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#064e3b', fontWeight: 600, marginBottom: '4px' }}>总库存</div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#10b981' }}>
                    {materialInventories.reduce((sum, inv) => sum + (Number(inv.quantity) || 0), 0).toFixed(1)}
                  </div>
                </div>
              </div>
            </div>
            
            {/* 仓库库存列表 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
              {materialInventories.map((inventory, idx) => {
                const status = inventory.hasInventory ? getInventoryStatus(inventory.quantity, inventory.safetyStock) : null;
                const StatusIcon = status?.icon;
                const isEditing = editingInventory?.warehouseId === inventory.warehouseId;
                
                return (
                  <div key={idx} style={{
                    padding: '16px',
                    background: inventory.hasInventory ? 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' : '#fafafa',
                    borderRadius: '12px',
                    border: inventory.hasInventory ? '1px solid #e2e8f0' : '1px dashed #d1d5db'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: inventory.hasInventory ? '12px' : 0 }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                          🏢 {inventory.warehouseCode} - {inventory.warehouseName}
                        </div>
                        {!inventory.hasInventory && (
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>未设置库存</div>
                        )}
                      </div>
                      
                      {inventory.hasInventory ? (
                        isEditing ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <Button size="sm" variant="secondary" onClick={() => setEditingInventory(null)}>取消</Button>
                            <Button size="sm" variant="success" icon={Save} onClick={handleSaveInventory}>保存</Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="secondary" icon={Edit} onClick={() => editWarehouseInventory(inventory)}>
                            编辑
                          </Button>
                        )
                      ) : (
                        <Button size="sm" variant="success" icon={Plus} onClick={() => handleAddToWarehouse(inventory.warehouseId)}>
                          添加到此仓库
                        </Button>
                      )}
                    </div>

                    {inventory.hasInventory && (
                      isEditing ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
                              当前库存
                            </label>
                            <input
                              type="number"
                              value={inventoryFormData.quantity}
                              onChange={e => setInventoryFormData({ ...inventoryFormData, quantity: parseFloat(e.target.value) || 0 })}
                              step="0.1"
                              style={{ width: '100%', padding: '10px 12px', fontSize: '14px', border: '2px solid #3b82f6', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', fontWeight: 600 }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
                              安全库存
                            </label>
                            <input
                              type="number"
                              value={inventoryFormData.safetyStock}
                              onChange={e => setInventoryFormData({ ...inventoryFormData, safetyStock: parseInt(e.target.value) || 100 })}
                              style={{ width: '100%', padding: '10px 12px', fontSize: '14px', border: '2px solid #3b82f6', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', fontWeight: 600 }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                          <div>
                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>当前库存</div>
                            <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
                              {(Number(inventory.quantity) || 0).toFixed(1)}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>安全库存</div>
                            <div style={{ fontSize: '20px', fontWeight: 700, color: '#3b82f6' }}>
                              {inventory.safetyStock || 100}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>库存状态</div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: status.bgColor, borderRadius: '8px' }}>
                              <StatusIcon size={14} style={{ color: status.color }} />
                              <span style={{ fontSize: '12px', fontWeight: 700, color: status.color }}>{status.text}</span>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => {
                setShowInventoryModal(false);
                setEditingInventory(null);
              }}>
                关闭
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
});

export default MaterialManagementPage;