import React, { useState } from 'react';
import { Form, Button, Container } from 'react-bootstrap';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { confirmResetPassword } from '../api';

const ResetPasswordConfirm = () => {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!uid || !token) {
      toast.error('Invalid reset link');
      return;
    }
    setLoading(true);
    try {
      const res = await confirmResetPassword({ new_password: newPassword }, uid, token);
      if (res.data.success) {
        toast.success('Password reset successful! Login now.');
        navigate('/');
      } else {
        toast.error(res.data.message || 'Failed');
      }
    } catch (err) {
      toast.error('Invalid token or error');
    }
    setLoading(false);
  };

  return (
    <Container className="form-container">
      <h3 className="text-center mb-4">Reset Password</h3>
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>New Password</Form.Label>
          <Form.Control type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
        </Form.Group>
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? <div className="loader"></div> : 'Reset Password'}
        </Button>
      </Form>
    </Container>
  );
};

export default ResetPasswordConfirm;
