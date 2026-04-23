import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import './AdminUserForm.css'; // Will create or reuse product form CSS

const AdminUserForm = ({ onSubmit, loading, initialData }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone_number: '',
    role: 'user',
    address: '',
    gender: 'Nam',
    dob: ''
  });
  
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        password: '', // Should be empty when editing unless changing
        phone_number: initialData.phone_number || '',
        role: initialData.role || 'user',
        address: initialData.address || '',
        gender: initialData.gender || 'Nam',
        dob: initialData.dob ? new Date(initialData.dob).toISOString().substr(0, 10) : ''
      });
      if (initialData.avatar) {
        setAvatarPreview(initialData.avatar);
      }
    }
  }, [initialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!initialData && (!formData.password || formData.password.trim() === '')) {
      alert("Vui lòng nhập mật khẩu cho người dùng mới!");
      return;
    }
    
    const submitData = new FormData();
    Object.keys(formData).forEach(key => {
        if (formData[key]) submitData.append(key, formData[key]);
    });
    
    if (avatarFile) {
        submitData.append('avatar', avatarFile);
    }
    
    onSubmit(submitData);
  };

  return (
    <div className="product-form-container">
      <h2>{initialData ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Tên người dùng</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="pd-form-input"
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="pd-form-input"
          />
        </div>

        <div className="form-group">
          <label>Mật khẩu {initialData && "(Để trống nếu không muốn đổi)"}</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className="pd-form-input"
          />
        </div>

        <div className="form-group">
          <label>Số điện thoại</label>
          <input
            type="text"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleInputChange}
            className="pd-form-input"
          />
        </div>

        <div className="form-group">
          <label>Role</label>
          <select name="role" value={formData.role} onChange={handleInputChange} className="pd-form-input">
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="form-group">
          <label>Địa chỉ</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            className="pd-form-input"
          />
        </div>

        <div className="form-group">
          <label>Ngày sinh</label>
          <input
            type="date"
            name="dob"
            value={formData.dob}
            onChange={handleInputChange}
            className="pd-form-input"
          />
        </div>

        <div className="form-group">
          <label>Giới tính</label>
          <select name="gender" value={formData.gender} onChange={handleInputChange} className="pd-form-input">
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
            <option value="Khác">Khác</option>
          </select>
        </div>

        <div className="form-group">
          <label>Ảnh đại diện (Avatar)</label>
          <input type="file" accept="image/*" onChange={handleImageChange} className="pd-form-input" />
          {avatarPreview && (
            <div className="image-preview" style={{marginTop: '10px', position: 'relative', width: '150px'}}>
              <img 
                src={avatarPreview} 
                alt="Preview" 
                style={{width: '150px', height: '150px', objectFit: 'cover', borderRadius: '50%'}} 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://i.pinimg.com/736x/8f/1c/a2/8f1ca2029e2efceebd22fa05cca423d7.jpg';
                }}
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                style={{position: 'absolute', top: 0, right: 0, background: 'red', color: 'white', border: 'none', padding: '5px', borderRadius: '50%', cursor: 'pointer'}}
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
          <button type="submit" className="submit-btn" disabled={loading} style={{ flex: 1, margin: 0 }}>
            {loading ? 'Đang lưu...' : (initialData ? 'Cập nhật tài khoản' : 'Thêm tài khoản')}
          </button>
          <button type="button" className="cancel-btn" onClick={() => navigate(-1)} disabled={loading} style={{ flex: 1, backgroundColor: '#f5222d', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', padding: '12px' }}>
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminUserForm;
