import { useSelector } from 'react-redux';
import { formatPrice } from '../../store/slices/currencySlice';

const Price = ({ amount, className = '', showOriginal = false, originalAmount = null }) => {
  const { currentCurrency } = useSelector((state) => state.currency);

  const formattedPrice = formatPrice(amount, currentCurrency);

  if (showOriginal && originalAmount) {
    const formattedOriginal = formatPrice(originalAmount, currentCurrency);
    return (
      <span className={className}>
        <span className="text-red-500">{formattedPrice}</span>
        <span className="ml-2 text-gray-400 line-through text-sm">{formattedOriginal}</span>
      </span>
    );
  }

  return <span className={className}>{formattedPrice}</span>;
};

export default Price;
