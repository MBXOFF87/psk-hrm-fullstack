import { useState, useRef } from 'react';
import { Field, Input, Select, SectionTitle, NetDisplay, Avatar } from './UI';
import { BRANCHES, DEPARTMENTS, POSITIONS, NIGERIAN_BANKS } from '../utils/constants';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
];

export default function StaffForm({ staff, onSave, onClose, loading }) {
  const [form, setForm] = useState(staff || {
    name: '', branch: '', dept: '', position: '', department: '',
    gross: 0, paye: 0, vaccine: 0, loan: 0, otherDeductions: 0,
    accNum: '', bank: '', phone: '', address: '', dob: '', nin: '',
    resumption: '', kin_name: '', kin_phone: '', kin_rel: '', kin_address: '',
    status: 'active', photo: null, photoFile: null,
  });
  const [photoPreview, setPhotoPreview] = useState(
    staff?.photoFile ? `/uploads/${staff.photoFile}` : staff?.photo || null
  );
  const [photoFile, setPhotoFile] = useState(null);
  const fileRef = useRef();

  const s = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handlePhoto = e => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = ev => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!form.name?.trim()) return alert('Name is required');
    if (!form.branch) return alert('Branch is required');
    onSave(form, photoFile);
  };

  return (
    <div>
      {/* Photo Upload */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <div
          onClick={() => fileRef.current.click()}
          style={{
            width: 72, height: 72, borderRadius: '50%', cursor: 'pointer',
            border: '2px dashed var(--border)', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg2)', flexShrink: 0
          }}
        >
          {photoPreview
            ? <img src={photoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 26 }}>📷</span>
          }
        </div>
        <div>
          <button className="btn btn-secondary btn-sm" onClick={() => fileRef.current.click()} type="button">
            Upload Photo
          </button>
          {photoPreview && (
            <button
              className="btn btn-sm"
              style={{ marginLeft: 8, background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }}
              onClick={() => { setPhotoPreview(null); setPhotoFile(null); s('photo', null); s('photoFile', null); }}
              type="button"
            >
              Remove
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
        </div>
      </div>

      {/* Basic Info */}
      <SectionTitle>Basic Information</SectionTitle>
      <div className="form-grid">
        <Field label="Full Name (SURNAME FIRSTNAME)" full>
          <Input value={form.name} onChange={v => s('name', v)} placeholder="e.g. OKORO JAMES CHUKWUEMEKA" />
        </Field>
        <Field label="Branch" half>
          <Select value={form.branch} onChange={v => s('branch', v)} options={BRANCHES} />
        </Field>
        <Field label="Status" half>
          <Select value={form.status} onChange={v => s('status', v)} options={STATUS_OPTIONS} />
        </Field>
        <Field label="Position" half>
          <Select value={form.position} onChange={v => s('position', v)} options={POSITIONS} />
        </Field>
        <Field label="Department" half>
          <Select value={form.department} onChange={v => s('department', v)} options={DEPARTMENTS} />
        </Field>
        <Field label="Date of Resumption" half>
          <Input value={form.resumption} onChange={v => s('resumption', v)} type="date" />
        </Field>
        <Field label="Date of Birth" half>
          <Input value={form.dob} onChange={v => s('dob', v)} type="date" />
        </Field>
        <Field label="Tel. Number" half>
          <Input value={form.phone} onChange={v => s('phone', v)} placeholder="08000000000" />
        </Field>
        <Field label="NIN" half>
          <Input value={form.nin} onChange={v => s('nin', v)} placeholder="National Identification Number" />
        </Field>
        <Field label="Residential Address" full>
          <Input value={form.address} onChange={v => s('address', v)} placeholder="Full residential address" />
        </Field>
      </div>

      {/* Next of Kin */}
      <SectionTitle>Next of Kin</SectionTitle>
      <div className="form-grid">
        <Field label="Full Name" half>
          <Input value={form.kin_name} onChange={v => s('kin_name', v)} />
        </Field>
        <Field label="Tel. Number" half>
          <Input value={form.kin_phone} onChange={v => s('kin_phone', v)} placeholder="08000000000" />
        </Field>
        <Field label="Relationship" half>
          <Input value={form.kin_rel} onChange={v => s('kin_rel', v)} placeholder="e.g. Spouse, Parent, Sibling" />
        </Field>
        <Field label="Residential Address" half>
          <Input value={form.kin_address} onChange={v => s('kin_address', v)} />
        </Field>
      </div>

      {/* Bank Details */}
      <SectionTitle>Bank Account Details</SectionTitle>
      <div className="form-grid">
        <Field label="Account Number" half>
          <Input value={form.accNum} onChange={v => s('accNum', v)} placeholder="10-digit account number" />
        </Field>
        <Field label="Bank Name" half>
          <Select value={form.bank} onChange={v => s('bank', v)} options={NIGERIAN_BANKS} placeholder="Select bank..." />
        </Field>
      </div>

      {/* Salary */}
      <SectionTitle>Salary & Deductions</SectionTitle>
      <div className="form-grid">
        <Field label="Gross Salary (₦)" half>
          <Input value={form.gross} onChange={v => s('gross', Number(v))} type="number" />
        </Field>
        <Field label="PAYE (₦)" half>
          <Input value={form.paye} onChange={v => s('paye', Number(v))} type="number" />
        </Field>
        <Field label="Vaccine Deduction (₦)" half>
          <Input value={form.vaccine} onChange={v => s('vaccine', Number(v))} type="number" />
        </Field>
        <Field label="Loan Repayment/Month (₦)" half>
          <Input value={form.loan} onChange={v => s('loan', Number(v))} type="number" />
        </Field>
        <Field label="Other Deductions (₦)" half>
          <Input value={form.otherDeductions} onChange={v => s('otherDeductions', Number(v))} type="number" />
        </Field>
        <Field label="" half>
          <NetDisplay {...form} />
        </Field>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
        <button className="btn btn-secondary" onClick={onClose} type="button">Cancel</button>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading} type="button">
          {loading ? <><div className="spinner" /> Saving...</> : (staff ? 'Save Changes' : 'Add Staff')}
        </button>
      </div>
    </div>
  );
}
