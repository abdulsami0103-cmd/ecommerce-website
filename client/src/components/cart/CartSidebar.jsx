import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { setCartOpen } from '../../store/slices/uiSlice';

// Inline SVG Icons
const XIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const MinusIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
  </svg>
);
const PlusIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);
const TrashIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
import {
  removeFromCart,
  updateQuantity,
} from '../../store/slices/cartSlice';
import { Button, Price } from '../common';

const CartSidebar = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const { cartOpen } = useSelector((state) => state.ui);
  const { items, subtotal, shipping, tax, total } = useSelector(
    (state) => state.cart
  );

  if (!cartOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={() => dispatch(setCartOpen(false))}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{t('cart.title')}</h2>
          <button
            onClick={() => dispatch(setCartOpen(false))}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">{t('cart.empty')}</p>
              <Button
                variant="outline"
                onClick={() => dispatch(setCartOpen(false))}
              >
                {t('cart.continueShopping')}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={`${item.product}-${item.variant || index}`}
                  className="flex gap-4 p-4 bg-gray-50 rounded-lg"
                >
                  <img
                    src={item.image || 'https://placehold.co/80'}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-sm line-clamp-2">
                      {item.name}
                    </h3>
                    {item.variant && (
                      <p className="text-xs text-gray-500">{item.variant}</p>
                    )}
                    <Price amount={item.price} className="text-sm font-semibold text-primary-600 mt-1 block" />

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border rounded-lg">
                        <button
                          onClick={() =>
                            dispatch(
                              updateQuantity({
                                productId: item.product,
                                variant: item.variant,
                                quantity: item.quantity - 1,
                              })
                            )
                          }
                          disabled={item.quantity <= 1}
                          className="p-1 hover:bg-gray-100 disabled:opacity-50"
                        >
                          <MinusIcon className="w-4 h-4" />
                        </button>
                        <span className="px-3 text-sm">{item.quantity}</span>
                        <button
                          onClick={() =>
                            dispatch(
                              updateQuantity({
                                productId: item.product,
                                variant: item.variant,
                                quantity: item.quantity + 1,
                              })
                            )
                          }
                          disabled={item.quantity >= item.maxQuantity}
                          className="p-1 hover:bg-gray-100 disabled:opacity-50"
                        >
                          <PlusIcon className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() =>
                          dispatch(
                            removeFromCart({
                              productId: item.product,
                              variant: item.variant,
                            })
                          )
                        }
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-4 space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('cart.subtotal')}</span>
                <Price amount={subtotal} />
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('cart.shipping')}</span>
                {shipping === 0 ? <span>Free</span> : <Price amount={shipping} />}
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('cart.tax')}</span>
                <Price amount={tax} />
              </div>
              <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                <span>{t('cart.total')}</span>
                <Price amount={total} />
              </div>
            </div>

            <Link
              to="/checkout"
              onClick={() => dispatch(setCartOpen(false))}
              className="btn-primary w-full text-center"
            >
              {t('cart.checkout')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartSidebar;
