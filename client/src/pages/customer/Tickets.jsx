import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  SupportAgent as SupportIcon,
} from '@mui/icons-material';
import api from '../../services/api';

const TICKET_CATEGORIES = [
  { value: 'order_issue', label: 'Order Issue' },
  { value: 'product_inquiry', label: 'Product Inquiry' },
  { value: 'payment', label: 'Payment' },
  { value: 'shipping', label: 'Shipping' },
  { value: 'refund', label: 'Refund' },
  { value: 'general', label: 'General' },
  { value: 'technical', label: 'Technical Support' },
];

const STATUS_COLORS = {
  open: 'info',
  assigned: 'secondary',
  in_progress: 'warning',
  waiting_customer: 'warning',
  waiting_vendor: 'default',
  escalated: 'error',
  resolved: 'success',
  closed: 'default',
};

const initialFormState = {
  category: '',
  subject: '',
  description: '',
  priority: 'medium',
  orderId: '',
};

export default function CustomerTickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalTickets, setTotalTickets] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  // Create ticket dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Orders for linking
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchTickets();
    fetchOrders();
  }, [page, rowsPerPage, statusFilter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page + 1,
        limit: rowsPerPage,
      });
      if (statusFilter) params.append('status', statusFilter);

      const response = await api.get(`/tickets?${params}`);
      setTickets(response.data.data);
      setTotalTickets(response.data.pagination.total);
    } catch (err) {
      setError('Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders?limit=20');
      setOrders(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  };

  const handleOpenDialog = () => {
    setFormData(initialFormState);
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData(initialFormState);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.category) errors.category = 'Category is required';
    if (!formData.subject.trim()) errors.subject = 'Subject is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (formData.description.length < 20) {
      errors.description = 'Description must be at least 20 characters';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        orderId: formData.orderId || undefined,
      };

      const response = await api.post('/tickets', payload);
      setSuccess('Ticket created successfully');
      handleCloseDialog();
      fetchTickets();

      // Navigate to the new ticket
      setTimeout(() => {
        navigate(`/tickets/${response.data.data._id}`);
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      open: 'Open',
      assigned: 'Assigned',
      in_progress: 'In Progress',
      waiting_customer: 'Awaiting Your Reply',
      waiting_vendor: 'Awaiting Vendor',
      escalated: 'Escalated',
      resolved: 'Resolved',
      closed: 'Closed',
    };
    return labels[status] || status;
  };

  // Count tickets by status
  const openCount = tickets.filter(t => ['open', 'assigned', 'in_progress', 'waiting_customer', 'waiting_vendor'].includes(t.status)).length;
  const resolvedCount = tickets.filter(t => t.status === 'resolved').length;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SupportIcon fontSize="large" color="primary" />
          <Typography variant="h4">Support Tickets</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          New Ticket
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" variant="body2">
                Total Tickets
              </Typography>
              <Typography variant="h5">{totalTickets}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" variant="body2">
                Open
              </Typography>
              <Typography variant="h5" color="primary">
                {openCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" variant="body2">
                Resolved
              </Typography>
              <Typography variant="h5" color="success.main">
                {resolvedCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" variant="body2">
                Awaiting Reply
              </Typography>
              <Typography variant="h5" color="warning.main">
                {tickets.filter(t => t.status === 'waiting_customer').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="open">Open</MenuItem>
            <MenuItem value="waiting_customer">Awaiting My Reply</MenuItem>
            <MenuItem value="resolved">Resolved</MenuItem>
            <MenuItem value="closed">Closed</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {/* Tickets Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Ticket #</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Last Activity</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary">
                    No tickets found. Need help? Create a new ticket!
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((ticket) => (
                <TableRow key={ticket._id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {ticket.ticketNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 250 }}>
                      {ticket.subject}
                    </Typography>
                    {ticket.order && (
                      <Typography variant="caption" color="textSecondary" display="block">
                        Order: {ticket.order.orderNumber}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={TICKET_CATEGORIES.find(c => c.value === ticket.category)?.label || ticket.category}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={getStatusLabel(ticket.status)}
                      color={STATUS_COLORS[ticket.status] || 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(ticket.lastActivityAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      startIcon={<ViewIcon />}
                      component={Link}
                      to={`/tickets/${ticket._id}`}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalTickets}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      {/* Create Ticket Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create Support Ticket</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!formErrors.category}>
                  <InputLabel>Category *</InputLabel>
                  <Select
                    value={formData.category}
                    label="Category *"
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {TICKET_CATEGORIES.map((cat) => (
                      <MenuItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.category && (
                    <Typography variant="caption" color="error">
                      {formErrors.category}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={formData.priority}
                    label="Priority"
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {orders.length > 0 && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Related Order (Optional)</InputLabel>
                    <Select
                      value={formData.orderId}
                      label="Related Order (Optional)"
                      onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                    >
                      <MenuItem value="">None</MenuItem>
                      {orders.map((order) => (
                        <MenuItem key={order._id} value={order._id}>
                          {order.orderNumber} - Rs. {order.totals?.total?.toLocaleString()}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Subject *"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  error={!!formErrors.subject}
                  helperText={formErrors.subject}
                  inputProps={{ maxLength: 200 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description *"
                  multiline
                  rows={5}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  error={!!formErrors.description}
                  helperText={formErrors.description || 'Please describe your issue in detail'}
                  inputProps={{ maxLength: 5000 }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : 'Create Ticket'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
