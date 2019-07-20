import JWT from 'jsonwebtoken';
import { promisify } from 'util';

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: 'Token not provided'
    });
  }

  const [, token] = authHeader.split(' ');

  try {
    const decoded = await promisify(JWT.verify)(token, process.env.JWT_SECRET);

    req.userId = decoded.id;

    return next();
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid Token'
    });
  }
};

export default authMiddleware;
