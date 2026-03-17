import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faSave } from "@fortawesome/free-solid-svg-icons";
import "./Profile.css";
import { useGetProfileQuery, useUpdateProfileMutation  } from "../../../features/user/userApi";

function Profile() {
  const { data: profile, isLoading, isError } = useGetProfileQuery();
  const [updateProfile] = useUpdateProfileMutation ();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(null);

  // Load lại form khi có dữ liệu profile
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        email: profile.email || "",
        phone_number: profile.phone_number || "",
        gender: profile.gender || "",
        dob: profile.dob || "",
        address: profile.address || "",
        avatar: profile.avatar || "",
        id: profile.id, 
      });
    }
  }, [profile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, avatar: imageUrl }));
    }
  };

  const handleSave = async () => {
    try {
      const { id, ...updateData } = formData;
      await updateProfile(updateData).unwrap();
      setIsEditing(false);
      alert("Cập nhật thành công!");
    } catch (err) {
      console.error("Update error", err);
      alert("Lỗi khi cập nhật hồ sơ.");
    }
  };

  if (isLoading) return <p>Đang tải...</p>;
  if (isError || !formData) return <p>Lỗi khi tải thông tin.</p>;

  return (
    <div className="profile-container">
      <div className="profile-info">
        <h2>Thông tin tài khoản</h2>

        <div className="profile-field">
          <label>Họ và tên:</label>
          {isEditing ? (
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} />
          ) : (
            <span>{formData.name || ""}</span>
          )}
        </div>

        <div className="profile-field">
          <label>Email:</label>
          <span>{formData.email || ""}</span>
        </div>

        <div className="profile-field">
          <label>Số điện thoại:</label>
          {isEditing ? (
            <input type="text" name="phone_number" value={formData.phone_number} onChange={handleInputChange} />
          ) : (
            <span>{formData.phone_number || ""}</span>
          )}
        </div>


        <div className="profile-actions">
          {isEditing ? (
            <button className="save-btn" onClick={handleSave}>
              <FontAwesomeIcon icon={faSave} /> Lưu
            </button>
          ) : (
            <button className="edit-btn" onClick={() => setIsEditing(true)}>
              <FontAwesomeIcon icon={faEdit} /> Chỉnh sửa
            </button>
          )}
        </div>
      </div>

      <div className="profile-avatar">
        <div className="avatar-container">
          <img
            src={formData.avatar || "https://i.pinimg.com/736x/8f/1c/a2/8f1ca2029e2efceebd22fa05cca423d7.jpg"}
            alt="Avatar"
            className="avatar"
          />
          {isEditing && <input type="file" accept="image/*" onChange={handleFileChange} />}
        </div>
      </div>
    </div>
  );
}

export default Profile;
