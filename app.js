const STORAGE_KEYS = {
  users: 'pc_users',
  departments: 'pc_departments',
  positions: 'pc_positions',
  employees: 'pc_employees',
  contracts: 'pc_contracts',
  session: 'pc_session'
};

const seedIfEmpty = () => {
  if (!localStorage.getItem(STORAGE_KEYS.users)) {
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify([
      { id: Date.now(), name: 'System Admin', email: 'admin@polycafe.vn', password: '123456', role: 'admin', country: 'Vietnam', locked: false }
    ]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.departments)) {
    localStorage.setItem(STORAGE_KEYS.departments, JSON.stringify(['Đào tạo', 'Hành chính', 'CNTT']));
  }
  if (!localStorage.getItem(STORAGE_KEYS.positions)) {
    localStorage.setItem(STORAGE_KEYS.positions, JSON.stringify(['Giảng viên', 'Chuyên viên', 'Trưởng phòng']));
  }
  if (!localStorage.getItem(STORAGE_KEYS.employees)) localStorage.setItem(STORAGE_KEYS.employees, JSON.stringify([]));
  if (!localStorage.getItem(STORAGE_KEYS.contracts)) localStorage.setItem(STORAGE_KEYS.contracts, JSON.stringify([]));
};

const getData = key => JSON.parse(localStorage.getItem(key) || '[]');
const setData = (key, data) => localStorage.setItem(key, JSON.stringify(data));

const toast = new bootstrap.Toast(document.getElementById('toast'));
const showToast = message => {
  document.getElementById('toastBody').textContent = message;
  toast.show();
};

const renderUsers = () => {
  const users = getData(STORAGE_KEYS.users);
  document.getElementById('usersTable').innerHTML = `
    <thead><tr><th>Tên</th><th>Email</th><th>Quốc gia</th><th>Vai trò</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
    <tbody>
      ${users.map((u, i) => `
        <tr>
          <td>${u.name}</td>
          <td>${u.email}</td>
          <td>${u.country}</td>
          <td>
            <select class="form-select form-select-sm" onchange="updateRole(${i}, this.value)">
              <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
              <option value="hr" ${u.role === 'hr' ? 'selected' : ''}>HR</option>
              <option value="manager" ${u.role === 'manager' ? 'selected' : ''}>Manager</option>
            </select>
          </td>
          <td>${u.locked ? '<span class="badge bg-danger">Khóa</span>' : '<span class="badge bg-success">Mở</span>'}</td>
          <td><button class="btn btn-sm btn-outline-secondary" onclick="toggleLock(${i})">Khóa/Mở</button></td>
        </tr>`).join('')}
    </tbody>`;
};

window.updateRole = (index, role) => {
  const users = getData(STORAGE_KEYS.users);
  users[index].role = role;
  setData(STORAGE_KEYS.users, users);
  showToast('Đã cập nhật vai trò.');
  renderUsers();
};

window.toggleLock = index => {
  const users = getData(STORAGE_KEYS.users);
  users[index].locked = !users[index].locked;
  setData(STORAGE_KEYS.users, users);
  showToast('Đã thay đổi trạng thái tài khoản.');
  renderUsers();
};

const renderSimpleList = (key, listId) => {
  const data = getData(key);
  document.getElementById(listId).innerHTML = data.map((item, i) =>
    `<li class="list-group-item d-flex justify-content-between align-items-center">${item}
      <button class="btn btn-sm btn-outline-danger" onclick="removeItem('${key}', ${i})">Xóa</button>
    </li>`
  ).join('');
};

window.removeItem = (key, index) => {
  const data = getData(key);
  data.splice(index, 1);
  setData(key, data);
  renderOrg();
};

const renderOrg = () => {
  renderSimpleList(STORAGE_KEYS.departments, 'departmentList');
  renderSimpleList(STORAGE_KEYS.positions, 'positionList');
  const deptOptions = getData(STORAGE_KEYS.departments).map(d => `<option>${d}</option>`).join('');
  const posOptions = getData(STORAGE_KEYS.positions).map(p => `<option>${p}</option>`).join('');
  document.getElementById('empDepartment').innerHTML = deptOptions;
  document.getElementById('empPosition').innerHTML = posOptions;
};

const renderEmployees = () => {
  const keyword = document.getElementById('employeeSearch').value.toLowerCase();
  const data = getData(STORAGE_KEYS.employees).filter(e =>
    [e.code, e.name, e.department, e.position].join(' ').toLowerCase().includes(keyword)
  );
  document.getElementById('employeesTable').innerHTML = `
    <thead><tr><th>Mã</th><th>Tên</th><th>PB</th><th>CV</th><th>Trạng thái</th><th>BHXH</th><th>Ngày phép</th><th>Tài liệu</th></tr></thead>
    <tbody>${data.map(e => `<tr>
      <td>${e.code}</td><td>${e.name}</td><td>${e.department}</td><td>${e.position}</td>
      <td>${e.status}</td><td>${e.insurance}</td><td>${e.leaveDays}</td><td>${e.docs}</td>
    </tr>`).join('')}</tbody>`;
  renderReports();
};

const renderContracts = () => {
  const data = getData(STORAGE_KEYS.contracts);
  document.getElementById('contractsTable').innerHTML = `
    <thead><tr><th>Mã NV</th><th>Loại</th><th>Bắt đầu</th><th>Kết thúc</th></tr></thead>
    <tbody>${data.map(c => `<tr><td>${c.empCode}</td><td>${c.type}</td><td>${c.start}</td><td>${c.end}</td></tr>`).join('')}</tbody>`;

  const now = new Date();
  const expiring = data.filter(c => (new Date(c.end) - now) / (1000 * 60 * 60 * 24) <= 30);
  document.getElementById('expiringAlert').textContent = `Hợp đồng sắp hết hạn (<=30 ngày): ${expiring.length}`;
  renderReports();
};

const renderReports = () => {
  const employees = getData(STORAGE_KEYS.employees);
  const byStatus = employees.reduce((acc, e) => ({ ...acc, [e.status]: (acc[e.status] || 0) + 1 }), {});
  const byDept = employees.reduce((acc, e) => ({ ...acc, [e.department]: (acc[e.department] || 0) + 1 }), {});
  document.getElementById('reportTotal').innerHTML = `<strong>Tổng nhân viên</strong><div class="display-6">${employees.length}</div>`;
  document.getElementById('reportByStatus').innerHTML = `<strong>Theo trạng thái</strong><div>${Object.entries(byStatus).map(([k, v]) => `${k}: ${v}`).join('<br>') || 'Chưa có dữ liệu'}</div>`;
  document.getElementById('reportByDept').innerHTML = `<strong>Theo phòng ban</strong><div>${Object.entries(byDept).map(([k, v]) => `${k}: ${v}`).join('<br>') || 'Chưa có dữ liệu'}</div>`;
};

const renderSession = () => {
  const session = JSON.parse(localStorage.getItem(STORAGE_KEYS.session) || 'null');
  document.getElementById('currentUser').textContent = session
    ? `Đang đăng nhập: ${session.name} (${session.role})`
    : 'Chưa đăng nhập';
};

document.getElementById('registerForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = regName.value.trim();
  const email = regEmail.value.trim().toLowerCase();
  const password = regPassword.value;
  const country = regCountry.value;
  const role = regRole.value;

  if (!countryConfirm.checked || !country) {
    showToast('Bạn phải chọn và xác nhận quốc gia để đăng ký.');
    return;
  }

  const users = getData(STORAGE_KEYS.users);
  if (users.some(u => u.email === email)) {
    showToast('Email đã tồn tại.');
    return;
  }

  users.push({ id: Date.now(), name, email, password, country, role, locked: false });
  setData(STORAGE_KEYS.users, users);
  e.target.reset();
  showToast('Đăng ký thành công.');
  renderUsers();
});

document.getElementById('loginForm').addEventListener('submit', e => {
  e.preventDefault();
  const email = loginEmail.value.trim().toLowerCase();
  const password = loginPassword.value;
  const user = getData(STORAGE_KEYS.users).find(u => u.email === email && u.password === password);
  if (!user) return showToast('Sai email hoặc mật khẩu.');
  if (user.locked) return showToast('Tài khoản đang bị khóa.');
  localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(user));
  renderSession();
  showToast('Đăng nhập thành công.');
});

document.getElementById('departmentForm').addEventListener('submit', e => {
  e.preventDefault();
  const value = departmentInput.value.trim();
  if (!value) return;
  const data = getData(STORAGE_KEYS.departments);
  data.push(value);
  setData(STORAGE_KEYS.departments, data);
  departmentInput.value = '';
  renderOrg();
});

document.getElementById('positionForm').addEventListener('submit', e => {
  e.preventDefault();
  const value = positionInput.value.trim();
  if (!value) return;
  const data = getData(STORAGE_KEYS.positions);
  data.push(value);
  setData(STORAGE_KEYS.positions, data);
  positionInput.value = '';
  renderOrg();
});

document.getElementById('employeeForm').addEventListener('submit', e => {
  e.preventDefault();
  const employees = getData(STORAGE_KEYS.employees);
  const item = {
    code: empCode.value.trim(),
    name: empName.value.trim(),
    department: empDepartment.value,
    position: empPosition.value,
    status: empStatus.value,
    insurance: empInsurance.value.trim(),
    leaveDays: Number(empLeave.value || 0),
    docs: empDocs.value.trim()
  };
  const idx = employees.findIndex(emp => emp.code === item.code);
  if (idx >= 0) employees[idx] = item;
  else employees.push(item);
  setData(STORAGE_KEYS.employees, employees);
  e.target.reset();
  renderOrg();
  renderEmployees();
  showToast('Đã lưu hồ sơ nhân viên.');
});

document.getElementById('employeeSearch').addEventListener('input', renderEmployees);

document.getElementById('contractForm').addEventListener('submit', e => {
  e.preventDefault();
  const contracts = getData(STORAGE_KEYS.contracts);
  contracts.push({
    empCode: contractEmpCode.value.trim(),
    type: contractType.value,
    start: contractStart.value,
    end: contractEnd.value
  });
  setData(STORAGE_KEYS.contracts, contracts);
  e.target.reset();
  renderContracts();
  showToast('Đã lưu hợp đồng.');
});

seedIfEmpty();
renderSession();
renderUsers();
renderOrg();
renderEmployees();
renderContracts();
