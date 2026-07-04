import re
import os

path = 'd:/EBOOK/KÌ 8/SWP391_SU26/SWP/SWP (2)/SWP/SWP391_G5_FrontEnd/src/pages/Lecturer/MaterialsDashboard.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update initial states
content = content.replace("type: 'video', fileName: '', fileSize: '', fileObj: null, files: [], inputType: 'file'", "type: 'image', fileName: '', fileSize: '', fileObj: null, files: []")
content = content.replace("inputType: 'file', linkUrl: ''", "linkUrl: ''")
content = content.replace("inputType: 'link', linkUrl", "linkUrl")
content = content.replace("editMaterialForm.inputType", "editMaterialForm.type")
content = content.replace("newMaterialForm.inputType", "newMaterialForm.type")

# 2. Update dropdown options in Add and Edit Modals
old_select = '''<select className={styles.select} value={newMaterialForm.type}
                    onChange={(e) => setNewMaterialForm({ ...newMaterialForm, type: e.target.value })}>
                    <option value="video">Video bài giảng (quay trước)</option>
                    <option value="pdf">Tài liệu PDF</option>
                    <option value="document">Giáo trình doc</option>
                    <option value="quiz">Trắc nghiệm</option>
                  </select>'''
new_select = '''<select className={styles.select} value={newMaterialForm.type}
                    onChange={(e) => setNewMaterialForm({ ...newMaterialForm, type: e.target.value })}>
                    <option value="image">Hình ảnh (Tải lên)</option>
                    <option value="video">Link Video</option>
                  </select>'''
content = content.replace(old_select, new_select)

old_edit_select = '''<select className={styles.select} value={editMaterialForm.type} onChange={(e) => setEditMaterialForm({ ...editMaterialForm, type: e.target.value })}>
                        <option value="video">Video bài giảng (quay trước)</option>
                        <option value="pdf">Tài liệu PDF</option>
                        <option value="document">Giáo trình doc</option>
                        <option value="quiz">Trắc nghiệm</option>
                      </select>'''
new_edit_select = '''<select className={styles.select} value={editMaterialForm.type} onChange={(e) => setEditMaterialForm({ ...editMaterialForm, type: e.target.value })}>
                        <option value="image">Hình ảnh (Tải lên)</option>
                        <option value="video">Link Video</option>
                      </select>'''
content = content.replace(old_edit_select, new_edit_select)

# 3. Update inputType radio buttons (remove them)
radio_btns = '''<div style={{ display: 'flex', gap: 16, marginBottom: 12, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: newMaterialForm.inputType === 'file' ? '#059669' : '#64748b' }}>
                  <input type="radio" name="inputType" checked={newMaterialForm.inputType === 'file'} onChange={() => setNewMaterialForm({ ...newMaterialForm, inputType: 'file' })} />
                  Tải lên từ máy
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: newMaterialForm.inputType === 'link' ? '#059669' : '#64748b' }}>
                  <input type="radio" name="inputType" checked={newMaterialForm.inputType === 'link'} onChange={() => setNewMaterialForm({ ...newMaterialForm, inputType: 'link' })} />
                  Đính kèm liên kết
                </label>
              </div>'''
content = content.replace(radio_btns, "")

radio_btns_edit = '''<div style={{ display: 'flex', gap: 16, marginBottom: 12, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: editMaterialForm.type === 'file' ? '#059669' : '#64748b' }}>
                        <input type="radio" name="editInputType" checked={editMaterialForm.type === 'file'} onChange={() => setEditMaterialForm({ ...editMaterialForm, type: 'file' })} />
                        Tải lên từ máy
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: editMaterialForm.type === 'link' ? '#059669' : '#64748b' }}>
                        <input type="radio" name="editInputType" checked={editMaterialForm.type === 'link'} onChange={() => setEditMaterialForm({ ...editMaterialForm, type: 'link' })} />
                        Đính kèm liên kết
                      </label>
                    </div>'''
content = content.replace(radio_btns_edit, "")

# 4. Replace conditional rendering: {newMaterialForm.type === 'file' ? ( ... ) : ( ... )}
# We changed inputType to type, so it's {newMaterialForm.type === 'file' ?  -> change to {newMaterialForm.type === 'image' ?
content = content.replace("{newMaterialForm.type === 'file' ?", "{newMaterialForm.type === 'image' ?")
content = content.replace("{editMaterialForm.type === 'file' ?", "{editMaterialForm.type === 'image' ?")

# 5. Accept only images in Dropzone
content = content.replace('accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.mp4,.mov,.avi,.mkv,.webm,.jpg,.png,.zip,.json"', 'accept=".jpg,.jpeg,.png,.gif,.webp"')
content = content.replace('Hỗ trợ PDF, Word, Excel, Video (Max 50MB)', 'Hỗ trợ Hình ảnh (Max 50MB)')
content = content.replace('PDF, Word, Excel, Video, JSON...', 'PNG, JPG, WEBP (Max 50MB)')

# 6. Change filter options and badges
content = content.replace("{ key: 'pdf', label: '📄 PDF' },", "")
content = content.replace("{ key: 'document', label: '📝 Tài liệu' },", "")
content = content.replace("{ key: 'quiz', label: '✅ Trắc nghiệm' },", "")
content = content.replace("{ key: 'video', label: '🎬 Video' },", "{ key: 'video', label: '🎬 Video' },\\n              { key: 'image', label: '🖼️ Ảnh' },")

content = content.replace("video:    { label: '🎬 Video',     color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },", "video:    { label: '🎬 Video',     color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },\\n                                image:    { label: '🖼️ Ảnh',       color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },")

# 7. Update detectFileType
old_detect = '''  const detectFileType = (file) => {
    const mime = file.type || '';
    const name = file.name.toLowerCase();
    if (mime.startsWith('video/') || /\\.(mp4|mov|avi|mkv|webm)$/.test(name)) return 'video';
    if (mime === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
    if (/spreadsheet|excel|csv/.test(mime) || /\\.(xlsx?|csv)$/.test(name)) return 'document';
    if (/word|msword/.test(mime) || /\\.(docx?)$/.test(name)) return 'document';
    if (/quiz|json/.test(mime) || /\\.(json)$/.test(name)) return 'quiz';
    return 'document';
  };'''
new_detect = '''  const detectFileType = (file) => {
    return 'image'; // Mặc định chỉ nhận image theo yêu cầu
  };'''
content = content.replace(old_detect, new_detect)

# 8. Update renderFileIcon
old_icon = '''      case 'pdf': return <FileText size={32} color="#ef4444" />;
      case 'document': return <FileSpreadsheet size={32} color="#10b981" />;
      case 'quiz': return <CheckSquare size={32} color="#f59e0b" />;'''
new_icon = '''      case 'image': return <Image size={32} color="#10b981" />;'''
content = content.replace(old_icon, new_icon)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated MaterialsDashboard.jsx")
