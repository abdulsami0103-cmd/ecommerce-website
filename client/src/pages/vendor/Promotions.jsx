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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  TextField,
  Tooltip,
  Stepper,
  Step,
  StepLabel,
  FormHelperText,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Pause as PauseIcon,
  PlayArrow as ResumeIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Campaign as PromotionIcon,
  BarChart as StatsIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material';
import api from '../../services/api';

const STATUS_COLORS = {
  draft: 'default',
  pending_review: 'warning',
  approved: 'info',
  rejected: 'error',
  active: 'success',
  paused: 'default',
  completed: 'default',
  cancelled: 'error',
};

const STEPS = ['Select Placement', 'Choose Item', 'Creative', 'Budget & Schedule', 'Review'];

export default function VendorPromotions() {
  const [promotions, setPromotions] = useState([]);
  const [slots, setSlots] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPromotions, setTotalPromotions] = useState(0);
  const [stats, setStats] = useState({});
  const [statusFilter, setStatusFilter] = useState('');

  // Create dialog
  const [createDialog, setCreateDialog] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    slotId: '',
    entityType: 'product',
    entityId: '',
    title: '',
    description: '',
    imageUrl: '',
    callToAction: 'Shop Now',
    budgetType: 'total',
    budgetAmount: '',
    startsAt: '',
    expiresAt: '',
  });
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Stats dialog
  const [statsDialog, setStatsDialog] = useState(false);
  const [promoStats, setPromoStats] = useState(null);

  useEffect(() => {
    fetchPromotions();
    fetchSlots();
    fetchProducts();
  }, [page, rowsPerPage, statusFilter]);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page + 1,
        limit: rowsPerPage,
      });
      if (statusFilter) params.append('status', statusFilter);

      const response = await api.get(`/vendor/promotions?${params}`);
      setPromotions(response.data.data);
      setTotalPromotions(response.data.pagination.total);
      setStats(response.data.stats || {});
    } catch (err) {
      setError('Failed to fetch promotions');
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async () => {
    try {
      const response = await api.get('/promotions/slots');
      setSlots(response.data.data.filter(s => s.isActive));
    } catch (err) {
      console.error('Failed to fetch slots:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/vendor/products?limit=100');
      setProducts(response.data.data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'slotId') {
      const slot = slots.find(s => s._id === value);
      setSelectedSlot(slot);
    }
  };

  const handleCreatePromotion = async () => {
    try {
      await api.post('/vendor/promotions', {
        slot: formData.slotId,
        entityType: formData.entityType,
        entity: formData.entityId,
        creative: {
          title: formData.title,
          description: formData.description,
          imageUrl: formData.imageUrl,
          callToAction: formData.callToAction,
        },
        budget: {
          type: formData.budgetType,
          amount: parseFloat(formData.budgetAmount),
        },
        scheduling: {
          startsAt: formData.startsAt,
          expiresAt: formData.expiresAt,
        },
      });
      setSuccess('Promotion created and submitted for review');
      setCreateDialog(false);
      resetForm();
      fetchPromotions();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create promotion');
    }
  };

  const handlePauseResume = async (promo) => {
    try {
      const endpoint = promo.status === 'active' ? 'pause' : 'resume';
      await api.put(`/vendor/promotions/${promo._id}/${endpoint}`);
      setSuccess(`Promotion ${endpoint}d successfully`);
      fetchPromotions();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update promotion');
    }
  };

  const handleCancel = async (promoId) => {
    if (!window.confirm('Are you sure you want to cancel this promotion?')) return;
    try {
      await api.delete(`/vendor/promotions/${promoId}`);
      setSuccess('Promotion cancelled');
      fetchPromotions();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel promotion');
    }
  };

  const handleViewStats = async (promo) => {
    try {
      const response = await api.get(`/vendor/promotions/${promo._id}/stats`);
      setPromoStats(response.data.data);
      setStatsDialog(true);
    } catch (err) {
      setError('Failed to fetch promotion stats');
    }
  };

  const resetForm = () => {
    setFormData({
      slotId: '',
      entityType: 'product',
      entityId: '',
      title: '',
      description: '',
      imageUrl: '',
      callToAction: 'Shop Now',
      budgetType: 'total',
      budgetAmount: '',
      startsAt: '',
      expiresAt: '',
    });
    setActiveStep(0);
    setSelectedSlot(null);
  };

  const formatCurrency = (amount) => `Rs. ${amount?.toLocaleString() || 0}`;

  const getStatusLabel = (status) => {
    const labels = {
      draft: 'Draft',
      pending_review: 'Pending Review',
      approved: 'Approved',
      rejected: 'Rejected',
      active: 'Active',
      paused: 'Paused',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  };

  const canProceed = () => {
    switch (activeStep) {
      case 0:
        return !!formData.slotId;
      case 1:
        return !!formData.entityId;
      case 2:
        return formData.title && formData.imageUrl;
      case 3:
        return formData.budgetAmount && formData.startsAt && formData.expiresAt;
      default:
        return true;
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Select Ad Placement</Typography>
            <Grid container spacing={2}>
              {slots.map((slot) => (
                <Grid item xs={12} sm={6} key={slot._id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: formData.slotId === slot._id ? '2px solid' : '1px solid',
                      borderColor: formData.slotId === slot._id ? '#059669' : 'divider',
                      bgcolor: formData.slotId === slot._id ? '#ecfdf5' : 'white',
                    }}
                    onClick={() => {
                      setFormData(prev => ({ ...prev, slotId: slot._id }));
                      setSelectedSlot(slot);
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6">{slot.name}</Typography>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        {slot.description}
                      </Typography>
                      <Typography variant="body2">
                        Placement: <Chip size="small" label={slot.placement?.replace('_', ' ')} />
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {slot.pricingModel === 'fixed' && `Fixed: ${formatCurrency(slot.pricing?.daily)}/day`}
                        {slot.pricingModel === 'cpc' && `CPC: ${formatCurrency(slot.pricing?.perClick)}/click`}
                        {slot.pricingModel === 'cpm' && `CPM: ${formatCurrency(slot.pricing?.perImpression)}/1000 impressions`}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>What do you want to promote?</Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Entity Type</InputLabel>
              <Select
                name="entityType"
                value={formData.entityType}
                label="Entity Type"
                onChange={handleInputChange}
              >
                <MenuItem value="product">Product</MenuItem>
                <MenuItem value="vendor">My Store</MenuItem>
              </Select>
            </FormControl>

            {formData.entityType === 'product' && (
              <FormControl fullWidth>
                <InputLabel>Select Product</InputLabel>
                <Select
                  name="entityId"
                  value={formData.entityId}
                  label="Select Product"
                  onChange={handleInputChange}
                >
                  {products.map((product) => (
                    <MenuItem key={product._id} value={product._id}>
                      {product.name} - {formatCurrency(product.price)}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>Choose a product to feature in this promotion</FormHelperText>
              </FormControl>
            )}

            {formData.entityType === 'vendor' && (
              <Alert severity="info">
                Your store will be promoted. Entity ID will be set automatically.
              </Alert>
            )}
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Create Your Ad</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  helperText="Catchy headline for your promotion"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  helperText="Brief description (optional)"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Image URL"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  helperText={selectedSlot?.dimensions ?
                    `Recommended size: ${selectedSlot.dimensions.width}x${selectedSlot.dimensions.height}px` :
                    'Enter URL of your promotional image'
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Call to Action"
                  name="callToAction"
                  value={formData.callToAction}
                  onChange={handleInputChange}
                  helperText="Button text (e.g., Shop Now, Learn More)"
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Budget & Schedule</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Budget Type</InputLabel>
                  <Select
                    name="budgetType"
                    value={formData.budgetType}
                    label="Budget Type"
                    onChange={handleInputChange}
                  >
                    <MenuItem value="total">Total Budget</MenuItem>
                    <MenuItem value="daily">Daily Budget</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Budget Amount"
                  name="budgetAmount"
                  type="number"
                  value={formData.budgetAmount}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">Rs.</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  name="startsAt"
                  type="datetime-local"
                  value={formData.startsAt}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="End Date"
                  name="expiresAt"
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            {selectedSlot && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Pricing:</strong>{' '}
                  {selectedSlot.pricingModel === 'fixed' && `${formatCurrency(selectedSlot.pricing?.daily)} per day`}
                  {selectedSlot.pricingModel === 'cpc' && `${formatCurrency(selectedSlot.pricing?.perClick)} per click`}
                  {selectedSlot.pricingModel === 'cpm' && `${formatCurrency(selectedSlot.pricing?.perImpression)} per 1000 impressions`}
                </Typography>
              </Alert>
            )}
          </Box>
        );

      case 4:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Review Your Promotion</Typography>
            <Paper sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">Placement</Typography>
                  <Typography>{selectedSlot?.name}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">Promoting</Typography>
                  <Typography>{formData.entityType === 'vendor' ? 'My Store' : 'Product'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">Title</Typography>
                  <Typography variant="h6">{formData.title}</Typography>
                </Grid>
                {formData.description && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">Description</Typography>
                    <Typography>{formData.description}</Typography>
                  </Grid>
                )}
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">Budget</Typography>
                  <Typography>
                    {formatCurrency(formData.budgetAmount)} ({formData.budgetType})
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">Schedule</Typography>
                  <Typography>
                    {new Date(formData.startsAt).toLocaleDateString()} - {new Date(formData.expiresAt).toLocaleDateString()}
                  </Typography>
                </Grid>
                {formData.imageUrl && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">Preview</Typography>
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain', marginTop: 8 }}
                    />
                  </Grid>
                )}
              </Grid>
            </Paper>
            <Alert severity="warning" sx={{ mt: 2 }}>
              Your promotion will be submitted for admin review before going live.
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 1, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 2 } }}>
          <PromotionIcon sx={{ color: '#059669', fontSize: { xs: 20, sm: 32 } }} />
          <Typography sx={{ color: '#059669', fontWeight: 'bold', fontSize: { xs: '1rem', sm: '2rem' } }}>Promotions</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton size="small" onClick={fetchPromotions} sx={{ color: '#059669', border: '1px solid #059669', borderRadius: 1, display: { xs: 'flex', sm: 'none' }, p: 0.5 }}>
            <RefreshIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={fetchPromotions} sx={{ color: '#059669', borderColor: '#059669', '&:hover': { borderColor: '#047857', bgcolor: '#ecfdf5' }, display: { xs: 'none', sm: 'inline-flex' } }}>
            Refresh
          </Button>
          <Button variant="contained" size="small" startIcon={<AddIcon sx={{ fontSize: { xs: 14, sm: 20 } }} />} onClick={() => setCreateDialog(true)} sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' }, fontSize: { xs: '0.65rem', sm: '0.875rem' }, px: { xs: 1, sm: 2 }, py: { xs: 0.3, sm: 0.75 }, minWidth: 'auto' }}>
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Create Promotion</Box>
            <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Create</Box>
          </Button>
        </Box>
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

      {/* Stats Cards */}
      <Grid container spacing={{ xs: 0.75, sm: 2 }} sx={{ mb: { xs: 1, sm: 3 } }}>
        <Grid item xs={4} sm={4} md={2}>
          <Card>
            <CardContent sx={{ p: { xs: '6px !important', sm: 2 }, '&:last-child': { pb: { xs: '6px !important', sm: 2 } } }}>
              <Typography color="textSecondary" sx={{ fontSize: { xs: '0.55rem', sm: '0.875rem' } }}>Active</Typography>
              <Typography color="success.main" sx={{ fontSize: { xs: '0.9rem', sm: '1.5rem' }, fontWeight: 600 }}>{stats.active || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={4} sm={4} md={2}>
          <Card>
            <CardContent sx={{ p: { xs: '6px !important', sm: 2 }, '&:last-child': { pb: { xs: '6px !important', sm: 2 } } }}>
              <Typography color="textSecondary" sx={{ fontSize: { xs: '0.55rem', sm: '0.875rem' } }}>Pending</Typography>
              <Typography color="warning.main" sx={{ fontSize: { xs: '0.9rem', sm: '1.5rem' }, fontWeight: 600 }}>{stats.pending_review || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={4} sm={4} md={2}>
          <Card>
            <CardContent sx={{ p: { xs: '6px !important', sm: 2 }, '&:last-child': { pb: { xs: '6px !important', sm: 2 } } }}>
              <Typography color="textSecondary" sx={{ fontSize: { xs: '0.55rem', sm: '0.875rem' } }}>Impress.</Typography>
              <Typography sx={{ fontSize: { xs: '0.9rem', sm: '1.5rem' }, fontWeight: 600 }}>{stats.totalImpressions || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card>
            <CardContent sx={{ p: { xs: '6px !important', sm: 2 }, '&:last-child': { pb: { xs: '6px !important', sm: 2 } } }}>
              <Typography color="textSecondary" sx={{ fontSize: { xs: '0.55rem', sm: '0.875rem' } }}>Clicks</Typography>
              <Typography sx={{ fontSize: { xs: '0.9rem', sm: '1.5rem' }, fontWeight: 600 }}>{stats.totalClicks || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card>
            <CardContent sx={{ p: { xs: '6px !important', sm: 2 }, '&:last-child': { pb: { xs: '6px !important', sm: 2 } } }}>
              <Typography color="textSecondary" sx={{ fontSize: { xs: '0.55rem', sm: '0.875rem' } }}>Spent</Typography>
              <Typography sx={{ fontSize: { xs: '0.9rem', sm: '1.5rem' }, fontWeight: 600 }}>{formatCurrency(stats.totalSpent)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: { xs: 1, sm: 2 }, mb: { xs: 1, sm: 2 } }}>
        <FormControl size="small" sx={{ minWidth: { xs: 100, sm: 180 } }}>
          <InputLabel sx={{ fontSize: { xs: '0.75rem', sm: '1rem' } }}>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ fontSize: { xs: '0.75rem', sm: '1rem' } }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="pending_review">Pending</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="paused">Paused</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {/* Desktop Promotions Table */}
      <TableContainer component={Paper} sx={{ display: { xs: 'none', sm: 'block' } }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#ecfdf5' }}>
              <TableCell sx={{ color: '#047857', fontWeight: 600 }}>Promotion</TableCell>
              <TableCell sx={{ color: '#047857', fontWeight: 600 }}>Placement</TableCell>
              <TableCell sx={{ color: '#047857', fontWeight: 600 }}>Period</TableCell>
              <TableCell sx={{ color: '#047857', fontWeight: 600 }}>Budget</TableCell>
              <TableCell sx={{ color: '#047857', fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ color: '#047857', fontWeight: 600 }}>Performance</TableCell>
              <TableCell align="right" sx={{ color: '#047857', fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : promotions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  No promotions found. Create your first promotion to get started.
                </TableCell>
              </TableRow>
            ) : (
              promotions.map((promo) => (
                <TableRow key={promo._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {promo.creative?.imageUrl && (
                        <img
                          src={promo.creative.imageUrl}
                          alt=""
                          style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
                        />
                      )}
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {promo.creative?.title}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {promo.entityType}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={promo.slot?.placement?.replace('_', ' ')} />
                  </TableCell>
                  <TableCell>
                    {new Date(promo.scheduling?.startsAt).toLocaleDateString()} -
                    <br />
                    {new Date(promo.scheduling?.expiresAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(promo.budget?.amount)}
                    <Typography variant="caption" display="block" color="textSecondary">
                      Spent: {formatCurrency(promo.budget?.spent)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={getStatusLabel(promo.status)}
                      color={STATUS_COLORS[promo.status]}
                    />
                    {promo.status === 'rejected' && promo.reviewNote && (
                      <Typography variant="caption" display="block" color="error">
                        {promo.reviewNote}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {promo.stats?.impressions || 0} impressions
                      <br />
                      {promo.stats?.clicks || 0} clicks
                      <br />
                      {promo.stats?.ctr || 0}% CTR
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Stats">
                      <IconButton size="small" onClick={() => handleViewStats(promo)}>
                        <StatsIcon />
                      </IconButton>
                    </Tooltip>
                    {(promo.status === 'active' || promo.status === 'paused') && (
                      <Tooltip title={promo.status === 'active' ? 'Pause' : 'Resume'}>
                        <IconButton size="small" onClick={() => handlePauseResume(promo)}>
                          {promo.status === 'active' ? <PauseIcon /> : <ResumeIcon />}
                        </IconButton>
                      </Tooltip>
                    )}
                    {['draft', 'pending_review', 'active', 'paused'].includes(promo.status) && (
                      <Tooltip title="Cancel">
                        <IconButton size="small" color="error" onClick={() => handleCancel(promo._id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalPromotions}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      {/* Mobile Promotions View */}
      <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={28} />
          </Box>
        ) : promotions.length === 0 ? (
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>
              No promotions found. Create your first promotion!
            </Typography>
          </Paper>
        ) : (
          <>
            {promotions.map((promo) => (
              <Paper key={promo._id} sx={{ p: 1, mb: 0.75, border: '1px solid #e5e7eb' }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 0.5, alignItems: 'center' }}>
                  {/* Title + Type: col 1-4 */}
                  <Box sx={{ gridColumn: 'span 4' }}>
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {promo.creative?.title || 'Untitled'}
                    </Typography>
                    <Typography sx={{ fontSize: '0.5rem', color: '#9ca3af' }}>
                      {promo.entityType}
                    </Typography>
                  </Box>
                  {/* Budget: col 5-6 */}
                  <Box sx={{ gridColumn: 'span 2', textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '0.6rem', fontWeight: 600 }}>
                      {promo.budget?.amount >= 1000 ? `Rs.${(promo.budget.amount/1000).toFixed(0)}K` : `Rs.${promo.budget?.amount || 0}`}
                    </Typography>
                    <Typography sx={{ fontSize: '0.45rem', color: '#9ca3af' }}>
                      {promo.stats?.clicks || 0} clicks
                    </Typography>
                  </Box>
                  {/* Status: col 7-9 */}
                  <Box sx={{ gridColumn: 'span 3', textAlign: 'center' }}>
                    <Chip size="small" label={getStatusLabel(promo.status)} color={STATUS_COLORS[promo.status]} sx={{ height: 18, fontSize: '0.5rem', '& .MuiChip-label': { px: 0.5 } }} />
                  </Box>
                  {/* Actions: col 10-12 */}
                  <Box sx={{ gridColumn: 'span 3', display: 'flex', justifyContent: 'flex-end', gap: 0.2 }}>
                    <IconButton size="small" onClick={() => handleViewStats(promo)} sx={{ p: 0.3 }}>
                      <StatsIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                    {(promo.status === 'active' || promo.status === 'paused') && (
                      <IconButton size="small" onClick={() => handlePauseResume(promo)} sx={{ p: 0.3 }}>
                        {promo.status === 'active' ? <PauseIcon sx={{ fontSize: 14 }} /> : <ResumeIcon sx={{ fontSize: 14 }} />}
                      </IconButton>
                    )}
                    {['draft', 'pending_review', 'active', 'paused'].includes(promo.status) && (
                      <IconButton size="small" color="error" onClick={() => handleCancel(promo._id)} sx={{ p: 0.3 }}>
                        <DeleteIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    )}
                  </Box>
                </Box>
              </Paper>
            ))}
            {/* Mobile Pagination */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, px: 0.5 }}>
              <Typography sx={{ fontSize: '0.6rem', color: '#6b7280' }}>
                {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, totalPromotions)} of {totalPromotions}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Button size="small" disabled={page === 0} onClick={() => setPage(page - 1)} sx={{ fontSize: '0.6rem', minWidth: 'auto', px: 1, py: 0.2 }}>
                  Prev
                </Button>
                <Button size="small" disabled={(page + 1) * rowsPerPage >= totalPromotions} onClick={() => setPage(page + 1)} sx={{ fontSize: '0.6rem', minWidth: 'auto', px: 1, py: 0.2 }}>
                  Next
                </Button>
              </Box>
            </Box>
          </>
        )}
      </Box>

      {/* Create Promotion Dialog */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontSize: { xs: '0.9rem', sm: '1.25rem' }, py: { xs: 1, sm: 2 } }}>Create Promotion</DialogTitle>
        <DialogContent sx={{ px: { xs: 1.5, sm: 3 } }}>
          <Stepper activeStep={activeStep} sx={{ pt: 1, pb: { xs: 1, sm: 3 } }} alternativeLabel>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: { xs: '0.55rem', sm: '0.875rem' } } }}>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          {renderStepContent()}
        </DialogContent>
        <DialogActions sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 0.5, sm: 1 } }}>
          <Button size="small" onClick={() => setCreateDialog(false)} sx={{ color: '#059669', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Cancel</Button>
          {activeStep > 0 && (
            <Button size="small" onClick={() => setActiveStep((prev) => prev - 1)} sx={{ color: '#059669', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Back</Button>
          )}
          {activeStep < STEPS.length - 1 ? (
            <Button
              variant="contained"
              size="small"
              onClick={() => setActiveStep((prev) => prev + 1)}
              disabled={!canProceed()}
              sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              size="small"
              onClick={handleCreatePromotion}
              sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              Submit
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Stats Dialog */}
      <Dialog open={statsDialog} onClose={() => setStatsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: { xs: '0.9rem', sm: '1.25rem' }, py: { xs: 1, sm: 2 } }}>Performance</DialogTitle>
        <DialogContent sx={{ px: { xs: 1.5, sm: 3 } }}>
          {promoStats && (
            <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ pt: 1 }}>
              <Grid item xs={6}>
                <Typography color="textSecondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.875rem' } }}>Impressions</Typography>
                <Typography sx={{ fontSize: { xs: '0.9rem', sm: '1.5rem' }, fontWeight: 600 }}>{promoStats.stats?.impressions || 0}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography color="textSecondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.875rem' } }}>Clicks</Typography>
                <Typography sx={{ fontSize: { xs: '0.9rem', sm: '1.5rem' }, fontWeight: 600 }}>{promoStats.stats?.clicks || 0}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography color="textSecondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.875rem' } }}>CTR</Typography>
                <Typography sx={{ fontSize: { xs: '0.9rem', sm: '1.5rem' }, fontWeight: 600 }}>{promoStats.performance?.ctr || 0}%</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography color="textSecondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.875rem' } }}>Unique Clicks</Typography>
                <Typography sx={{ fontSize: { xs: '0.9rem', sm: '1.5rem' }, fontWeight: 600 }}>{promoStats.stats?.uniqueClicks || 0}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography color="textSecondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.875rem' } }}>Conversions</Typography>
                <Typography sx={{ fontSize: { xs: '0.9rem', sm: '1.5rem' }, fontWeight: 600 }}>{promoStats.stats?.conversions || 0}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography color="textSecondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.875rem' } }}>Revenue</Typography>
                <Typography sx={{ fontSize: { xs: '0.9rem', sm: '1.5rem' }, fontWeight: 600 }}>{formatCurrency(promoStats.stats?.revenue)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography color="textSecondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.875rem' } }}>Spent</Typography>
                <Typography sx={{ fontSize: { xs: '0.9rem', sm: '1.5rem' }, fontWeight: 600 }}>{formatCurrency(promoStats.budget?.spent)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography color="textSecondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.875rem' } }}>ROAS</Typography>
                <Typography sx={{ fontSize: { xs: '0.9rem', sm: '1.5rem' }, fontWeight: 600 }}>{promoStats.performance?.roas || 0}x</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ py: { xs: 0.5, sm: 1 } }}>
          <Button size="small" onClick={() => setStatsDialog(false)} sx={{ color: '#059669', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
