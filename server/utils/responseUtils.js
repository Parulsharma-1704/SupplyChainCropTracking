// Success response
export const successResponse = (
  res,
  status = 200,
  message,
  data = null
) =>
  res.status(status).json({
    success: true,
    message,
    ...(data !== null && { data })
  });

// Error response
export const errorResponse = (
  res,
  status = 400,
  message,
  errors = null
) =>
  res.status(status).json({
    success: false,
    message,
    ...(errors && { errors })
  });

// Server error
export const serverError = (res, error) => {
  console.error(error);
  return res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
};
