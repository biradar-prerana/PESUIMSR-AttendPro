import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import EmployeeModal from './EmployeeModal';
import ConfirmDialog, { useConfirm } from '../../components/ConfirmDialog';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editEmp, setEditEmp] = useState(null);
  const navigate = useNavigate();
  const { confirm, dialog } = useConfirm();

  const fetchData = async () => {
    try {
      const [empRes, deptRes] = await Promise.all([
        api.get(`/employees?search=${search}&department=${deptFilter}`),
        api.get('/departments')
      ]);
      setEmployees(empRes.data);
      setDepartments(deptRes.data);
    } catch (err) {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [search, deptFilter]);

  const handleDelete = async (id) => {
    const ok = await confirm('Permanently delete this employee? This cannot be undone.', 'Delete Employee');
    if (!ok) return;
    try {
      await api.delete(`/employees/${id}`);
      toast.success('Employee deleted');
      fetchData();
    } catch { toast.error('Failed to delete employee'); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Employee Management</div>
          <div className="page-subtitle">{employees.length} employees registered</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditEmp(null); setShowModal(true); }}>
          + Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input className="form-input" placeholder="🔍 Search by name, ID, email..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 240 }} />
          <select className="form-select" value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={{ minWidth: 180 }}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          {loading ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--gray-400)' }}>Loading...</div> : (
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>ID</th>
                  <th>Department</th>
                  <th>Shift</th>
                  <th>Card No.</th>
                  <th>Biometric</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--gray-400)' }}>No employees found</td></tr>
                ) : employees.map(emp => (
                  <tr key={emp._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {emp.photo ? <img src={`http://localhost:5000${emp.photo}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <span style={{ color: 'white', fontWeight: 700 }}>{emp.firstName?.charAt(0)}</span>}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{emp.firstName} {emp.lastName}</div>
                          <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 600 }}>{emp.employeeId}</td>
                    <td>{emp.department?.name || '-'}</td>
                    <td style={{ fontSize: 13, color: 'var(--gray-500)' }}>{emp.shift ? `${emp.shift.name} (${emp.shift.startTime}-${emp.shift.endTime})` : '-'}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{emp.cardNumber || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <span className={`badge ${emp.biometric?.fingerprint ? 'badge-success' : 'badge-gray'}`} style={{ fontSize: 11 }}>🖐️ FP</span>
                        <span className={`badge ${emp.biometric?.faceData ? 'badge-success' : 'badge-gray'}`} style={{ fontSize: 11 }}>👁️ Face</span>
                      </div>
                    </td>
                    <td><span className={`badge ${emp.isActive ? 'badge-success' : 'badge-danger'}`}>{emp.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => navigate(`/employees/${emp._id}`)}>View</button>
                        <button className="btn btn-sm" style={{ background: 'var(--accent)', color: 'white' }} onClick={() => { setEditEmp(emp); setShowModal(true); }}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(emp._id)}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <EmployeeModal departments={departments} emp={editEmp} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); fetchData(); }} />
      )}
      <ConfirmDialog dialog={dialog} />
    </div>
  );
}
