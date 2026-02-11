import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Tooltip,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocalOffer as CouponIcon,
  BarChart as StatsIcon,
  ContentCopy as CopyIcon,
  Visibility as ViewIcon,
  VisibilityOff as HideIcon,
} from '@mui/icons-material';
import api from '../../services/api';

const COUPON_TYPES = [
  { value: 'percentage', label: 'Percentage Discount' },
  { value: 'fixed', label: 'Fixed Amount' },
  { value: 'free_shipping', label: 'Free Shipping' },
];

const initialFormState = {
  code: '',
  name: '',
  description: '',
  type: 'percentage',
  value: '',
  minPurchase: '',
  maxDiscount: '',
  startsAt: new Date(),
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  usageLimit: '',
  perUserLimit: 1,
  autoApply: false,
  firstOrderOnly: false,
  minItems: '',
};

export default function VendorCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCoupons, setTotalCoupons] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});

  // Stats dialog
  const [statsDialog, setStatsDialog] = useState(false);
  const [couponStats, setCouponStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Summary stats
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    totalUsage: 0,
  });

  useEffect(() => {
    fetchCoupons();
  }, [page, rowsPerPage, statusFilter]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page + 1,
        limit: rowsPerPage,
      });
      if (statusFilter) params.append('status', statusFilter);

      const response = await api.get(`/vendor/coupons?${params}`);
      setCoupons(response.data.data);
      setTotalCoupons(response.data.pagination.total);

      // Calculate summary
      const now = new Date();
      const activeCoupons = response.data.data.filter(
        (c) => c.isActive && new Date(c.expiresAt) > now
      );
      const totalUsage = response.data.data.reduce((sum, c) => sum + c.usedCount, 0);
      setSummary({
        total: response.data.pagination.total,
        active: activeCoupons.length,
        totalUsage,
      });
    } catch (err) {
      setError('Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (coupon = null) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        name: coupon.name,
        description: coupon.description || '',
        type: coupon.type,
        value: coupon.value,
        minPurchase: coupon.minPurchase || '',
        maxDiscount: coupon.maxDiscount || '',
        startsAt: new Date(coupon.startsAt),
        expiresAt: new Date(coupon.expiresAt),
        usageLimit: coupon.usageLimit || '',
        perUserLimit: coupon.perUserLimit || 1,
        autoApply: coupon.autoApply || false,
        firstOrderOnly: coupon.firstOrderOnly || false,
        minItems: coupon.minItems || '',
      });
    } else {
      setEditingCoupon(null);
      setFormData(initialFormState);
    }
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCoupon(null);
    setFormData(initialFormState);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.code.trim()) errors.code = 'Code is required';
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.value || formData.value <= 0) errors.value = 'Value must be greater than 0';
    if (formData.type === 'percentage' && formData.value > 100) {
      errors.value = 'Percentage cannot exceed 100';
    }
    if (!formData.expiresAt) errors.expiresAt = 'Expiry date is required';
    if (formData.expiresAt <= new Date()) errors.expiresAt = 'Expiry must be in the future';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const payload = {
        ...formData,
        value: parseFloat(formData.value),
        minPurchase: formData.minPurchase ? parseFloat(formData.minPurchase) : 0,
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : undefined,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        perUserLimit: parseInt(formData.perUserLimit) || 1,
        minItems: formData.minItems ? parseInt(formData.minItems) : 0,
      };

      if (editingCoupon) {
        await api.put(`/vendor/coupons/${editingCoupon._id}`, payload);
        setSuccess('Coupon updated successfully');
      } else {
        await api.post('/vendor/coupons', payload);
        setSuccess('Coupon created successfully');
      }

      handleCloseDialog();
      fetchCoupons();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save coupon');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (couponId) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;

    try {
      await api.delete(`/vendor/coupons/${couponId}`);
      setSuccess('Coupon deleted successfully');
      fetchCoupons();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete coupon');
    }
  };

  const handleToggleStatus = async (couponId) => {
    try {
      await api.put(`/vendor/coupons/${couponId}/toggle`);
      setSuccess('Coupon status updated');
      fetchCoupons();
    } catch (err) {
      setError('Failed to update coupon status');
    }
  };

  const handleViewStats = async (couponId) => {
    try {
      setStatsLoading(true);
      setStatsDialog(true);
      const response = await api.get(`/vendor/coupons/${couponId}/stats`);
      setCouponStats(response.data.data);
    } catch (err) {
      setError('Failed to fetch coupon statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('Coupon code copied to clipboard');
  };

  const getCouponStatus = (coupon) => {
    if (!coupon.isActive) return { label: 'Inactive', color: 'default' };
    if (new Date(coupon.expiresAt) < new Date()) return { label: 'Expired', color: 'error' };
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return { label: 'Exhausted', color: 'warning' };
    }
    return { label: 'Active', color: 'success' };
  };

  const formatCurrency = (amount) => {
    return `Rs. ${amount?.toLocaleString() || 0}`;
  };

  return (
      <Box sx={{ p: { xs: 1, sm: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 1.5, sm: 3 } }}>
          <Typography sx={{ color: '#059669', fontWeight: 'bold', fontSize: { xs: '1rem', sm: '2rem' } }}>Coupons</Typography>
          <Button variant="contained" size="small" startIcon={<AddIcon sx={{ fontSize: { xs: 14, sm: 20 } }} />} onClick={() => handleOpenDialog()} sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' }, fontSize: { xs: '0.65rem', sm: '0.875rem' }, px: { xs: 1, sm: 2 }, py: { xs: 0.3, sm: 0.75 }, minWidth: 'auto' }}>
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Create Coupon</Box>
            <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Create</Box>
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 1, fontSize: { xs: '0.7rem', sm: '0.875rem' }, py: { xs: 0, sm: 0.5 } }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 1, fontSize: { xs: '0.7rem', sm: '0.875rem' }, py: { xs: 0, sm: 0.5 } }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Summary Cards */}
        <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mb: { xs: 1.5, sm: 3 } }}>
          <Grid item xs={4}>
            <Card>
              <CardContent sx={{ p: { xs: '8px !important', sm: 2 }, '&:last-child': { pb: { xs: '8px !important', sm: 2 } } }}>
                <Typography color="textSecondary" sx={{ fontSize: { xs: '0.6rem', sm: '0.875rem' } }}>
                  Total
                </Typography>
                <Typography sx={{ fontSize: { xs: '1rem', sm: '1.5rem' }, fontWeight: 600 }}>{summary.total}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={4}>
            <Card>
              <CardContent sx={{ p: { xs: '8px !important', sm: 2 }, '&:last-child': { pb: { xs: '8px !important', sm: 2 } } }}>
                <Typography color="textSecondary" sx={{ fontSize: { xs: '0.6rem', sm: '0.875rem' } }}>
                  Active
                </Typography>
                <Typography color="success.main" sx={{ fontSize: { xs: '1rem', sm: '1.5rem' }, fontWeight: 600 }}>
                  {summary.active}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={4}>
            <Card>
              <CardContent sx={{ p: { xs: '8px !important', sm: 2 }, '&:last-child': { pb: { xs: '8px !important', sm: 2 } } }}>
                <Typography color="textSecondary" sx={{ fontSize: { xs: '0.6rem', sm: '0.875rem' } }}>
                  Usage
                </Typography>
                <Typography sx={{ fontSize: { xs: '1rem', sm: '1.5rem' }, fontWeight: 600 }}>{summary.totalUsage}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filter */}
        <Paper sx={{ p: { xs: 1, sm: 2 }, mb: { xs: 1, sm: 2 } }}>
          <FormControl size="small" sx={{ minWidth: { xs: 100, sm: 150 } }}>
            <InputLabel sx={{ fontSize: { xs: '0.75rem', sm: '1rem' } }}>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ fontSize: { xs: '0.75rem', sm: '1rem' } }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="expired">Expired</MenuItem>
            </Select>
          </FormControl>
        </Paper>

        {/* Desktop Coupons Table */}
        <TableContainer component={Paper} sx={{ display: { xs: 'none', sm: 'block' } }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#ecfdf5' }}>
                <TableCell sx={{ color: '#047857', fontWeight: 600 }}>Code</TableCell>
                <TableCell sx={{ color: '#047857', fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ color: '#047857', fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ color: '#047857', fontWeight: 600 }}>Value</TableCell>
                <TableCell sx={{ color: '#047857', fontWeight: 600 }}>Usage</TableCell>
                <TableCell sx={{ color: '#047857', fontWeight: 600 }}>Expires</TableCell>
                <TableCell sx={{ color: '#047857', fontWeight: 600 }}>Status</TableCell>
                <TableCell align="right" sx={{ color: '#047857', fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : coupons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="textSecondary">
                      No coupons found. Create your first coupon!
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                coupons.map((coupon) => {
                  const status = getCouponStatus(coupon);
                  return (
                    <TableRow key={coupon._id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CouponIcon sx={{ color: '#059669' }} fontSize="small" />
                          <Typography variant="body2" fontWeight="bold">
                            {coupon.code}
                          </Typography>
                          <IconButton size="small" onClick={() => copyToClipboard(coupon.code)}>
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell>{coupon.name}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={COUPON_TYPES.find((t) => t.value === coupon.type)?.label || coupon.type}
                        />
                      </TableCell>
                      <TableCell>
                        {coupon.type === 'percentage'
                          ? `${coupon.value}%`
                          : coupon.type === 'free_shipping'
                          ? 'Free'
                          : formatCurrency(coupon.value)}
                        {coupon.maxDiscount && (
                          <Typography variant="caption" display="block" color="textSecondary">
                            Max: {formatCurrency(coupon.maxDiscount)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {coupon.usedCount}
                        {coupon.usageLimit && ` / ${coupon.usageLimit}`}
                      </TableCell>
                      <TableCell>{new Date(coupon.expiresAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip size="small" label={status.label} color={status.color} />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title={coupon.isActive ? 'Deactivate' : 'Activate'}>
                          <IconButton size="small" onClick={() => handleToggleStatus(coupon._id)}>
                            {coupon.isActive ? <HideIcon /> : <ViewIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View Stats">
                          <IconButton size="small" onClick={() => handleViewStats(coupon._id)}>
                            <StatsIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleOpenDialog(coupon)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(coupon._id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={totalCoupons}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </TableContainer>

        {/* Mobile Coupons View */}
        <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={28} />
            </Box>
          ) : coupons.length === 0 ? (
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="textSecondary" sx={{ fontSize: '0.7rem' }}>
                No coupons found. Create your first coupon!
              </Typography>
            </Paper>
          ) : (
            <>
              {coupons.map((coupon) => {
                const status = getCouponStatus(coupon);
                return (
                  <Paper key={coupon._id} sx={{ p: 1, mb: 0.75, border: '1px solid #e5e7eb' }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 0.5, alignItems: 'center' }}>
                      {/* Code + Name: col 1-4 */}
                      <Box sx={{ gridColumn: 'span 4' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                          <CouponIcon sx={{ color: '#059669', fontSize: 12 }} />
                          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#059669' }}>
                            {coupon.code}
                          </Typography>
                          <IconButton size="small" onClick={() => copyToClipboard(coupon.code)} sx={{ p: 0.2 }}>
                            <CopyIcon sx={{ fontSize: 10 }} />
                          </IconButton>
                        </Box>
                        <Typography sx={{ fontSize: '0.55rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {coupon.name}
                        </Typography>
                      </Box>
                      {/* Value: col 5-6 */}
                      <Box sx={{ gridColumn: 'span 2', textAlign: 'center' }}>
                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 600 }}>
                          {coupon.type === 'percentage' ? `${coupon.value}%` : coupon.type === 'free_shipping' ? 'Free' : `Rs.${coupon.value}`}
                        </Typography>
                        <Typography sx={{ fontSize: '0.5rem', color: '#9ca3af' }}>
                          {coupon.usedCount}{coupon.usageLimit ? `/${coupon.usageLimit}` : ''} used
                        </Typography>
                      </Box>
                      {/* Status: col 7-8 */}
                      <Box sx={{ gridColumn: 'span 2', textAlign: 'center' }}>
                        <Chip size="small" label={status.label} color={status.color} sx={{ height: 18, fontSize: '0.55rem', '& .MuiChip-label': { px: 0.5 } }} />
                      </Box>
                      {/* Actions: col 9-12 */}
                      <Box sx={{ gridColumn: 'span 4', display: 'flex', justifyContent: 'flex-end', gap: 0.3 }}>
                        <IconButton size="small" onClick={() => handleToggleStatus(coupon._id)} sx={{ p: 0.3 }}>
                          {coupon.isActive ? <HideIcon sx={{ fontSize: 14 }} /> : <ViewIcon sx={{ fontSize: 14 }} />}
                        </IconButton>
                        <IconButton size="small" onClick={() => handleViewStats(coupon._id)} sx={{ p: 0.3 }}>
                          <StatsIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleOpenDialog(coupon)} sx={{ p: 0.3 }}>
                          <EditIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(coupon._id)} sx={{ p: 0.3 }}>
                          <DeleteIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Box>
                    </Box>
                  </Paper>
                );
              })}
              {/* Mobile Pagination */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, px: 0.5 }}>
                <Typography sx={{ fontSize: '0.6rem', color: '#6b7280' }}>
                  {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, totalCoupons)} of {totalCoupons}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Button size="small" disabled={page === 0} onClick={(e) => setPage(page - 1)} sx={{ fontSize: '0.6rem', minWidth: 'auto', px: 1, py: 0.2 }}>
                    Prev
                  </Button>
                  <Button size="small" disabled={(page + 1) * rowsPerPage >= totalCoupons} onClick={(e) => setPage(page + 1)} sx={{ fontSize: '0.6rem', minWidth: 'auto', px: 1, py: 0.2 }}>
                    Next
                  </Button>
                </Box>
              </Box>
            </>
          )}
        </Box>

        {/* Create/Edit Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontSize: { xs: '0.9rem', sm: '1.25rem' }, py: { xs: 1, sm: 2 } }}>{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</DialogTitle>
          <DialogContent sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 1, sm: 2 } }}>
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={{ xs: 1, sm: 2 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Coupon Code"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    error={!!formErrors.code}
                    helperText={formErrors.code || 'Will be auto-converted to uppercase'}
                    disabled={editingCoupon && editingCoupon.usedCount > 0}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Coupon Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    error={!!formErrors.name}
                    helperText={formErrors.name}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Coupon Type</InputLabel>
                    <Select
                      value={formData.type}
                      label="Coupon Type"
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      {COUPON_TYPES.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={
                      formData.type === 'percentage'
                        ? 'Discount Percentage'
                        : formData.type === 'free_shipping'
                        ? 'Value (ignored)'
                        : 'Discount Amount'
                    }
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    error={!!formErrors.value}
                    helperText={formErrors.value}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          {formData.type === 'percentage' ? '%' : 'Rs.'}
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Minimum Purchase"
                    type="number"
                    value={formData.minPurchase}
                    onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">Rs.</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Maximum Discount"
                    type="number"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                    helperText="For percentage coupons"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">Rs.</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="datetime-local"
                    value={formData.startsAt ? new Date(formData.startsAt).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setFormData({ ...formData, startsAt: e.target.value ? new Date(e.target.value) : null })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Expiry Date"
                    type="datetime-local"
                    value={formData.expiresAt ? new Date(formData.expiresAt).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value ? new Date(e.target.value) : null })}
                    InputLabelProps={{ shrink: true }}
                    error={!!formErrors.expiresAt}
                    helperText={formErrors.expiresAt}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Total Usage Limit"
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    helperText="Leave empty for unlimited"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Per User Limit"
                    type="number"
                    value={formData.perUserLimit}
                    onChange={(e) => setFormData({ ...formData, perUserLimit: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.autoApply}
                        onChange={(e) => setFormData({ ...formData, autoApply: e.target.checked })}
                      />
                    }
                    label="Auto-apply at checkout (no code needed)"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.firstOrderOnly}
                        onChange={(e) =>
                          setFormData({ ...formData, firstOrderOnly: e.target.checked })
                        }
                      />
                    }
                    label="First order only"
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 0.5, sm: 1 } }}>
            <Button onClick={handleCloseDialog} size="small" sx={{ color: '#059669', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Cancel</Button>
            <Button variant="contained" size="small" onClick={handleSubmit} disabled={loading} sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              {loading ? <CircularProgress size={18} /> : editingCoupon ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Stats Dialog */}
        <Dialog open={statsDialog} onClose={() => setStatsDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontSize: { xs: '0.9rem', sm: '1.25rem' }, py: { xs: 1, sm: 2 } }}>Coupon Stats</DialogTitle>
          <DialogContent sx={{ px: { xs: 1.5, sm: 3 } }}>
            {statsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : couponStats ? (
              <Box sx={{ pt: 1 }}>
                <Typography sx={{ fontSize: { xs: '0.8rem', sm: '1.25rem' }, fontWeight: 600 }} gutterBottom>
                  {couponStats.coupon.code} - {couponStats.coupon.name}
                </Typography>
                <Grid container spacing={{ xs: 1, sm: 2 }}>
                  <Grid item xs={6}>
                    <Typography color="textSecondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.875rem' } }}>Total Usage</Typography>
                    <Typography sx={{ fontSize: { xs: '0.9rem', sm: '1.25rem' }, fontWeight: 600 }}>{couponStats.stats.totalUsage}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography color="textSecondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.875rem' } }}>Unique Customers</Typography>
                    <Typography sx={{ fontSize: { xs: '0.9rem', sm: '1.25rem' }, fontWeight: 600 }}>{couponStats.stats.uniqueCustomers}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography color="textSecondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.875rem' } }}>Total Discount</Typography>
                    <Typography sx={{ fontSize: { xs: '0.9rem', sm: '1.25rem' }, fontWeight: 600 }}>
                      {formatCurrency(couponStats.stats.totalDiscount)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography color="textSecondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.875rem' } }}>Order Revenue</Typography>
                    <Typography sx={{ fontSize: { xs: '0.9rem', sm: '1.25rem' }, fontWeight: 600 }}>
                      {formatCurrency(couponStats.stats.totalRevenue)}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            ) : (
              <Typography sx={{ fontSize: '0.8rem' }}>No statistics available</Typography>
            )}
          </DialogContent>
          <DialogActions sx={{ py: { xs: 0.5, sm: 1 } }}>
            <Button size="small" onClick={() => setStatsDialog(false)} sx={{ color: '#059669', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
  );
}
