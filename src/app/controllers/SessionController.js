import * as Yup from 'yup';
import JWT from 'jsonwebtoken';

import User from '../models/User';

class SessionController {
  async store(req, res) {
    const schema = Yup.object().shape({
      email: Yup.string()
        .email()
        .required(),
      password: Yup.string()
        .min(6)
        .required()
    });

    const isValid = await schema.isValid(req.body);
    if (!isValid) {
      return res.status(400).json({ error: 'Validation Failed' });
    }

    const { email, password } = req.body;

    const user = await User.findOne({
      where: { email }
    });
    if (!user) {
      return res.status(404).json({ errror: 'User not found' });
    }

    if (!(await user.checkPassword(password))) {
      return res.status(401).json({
        error: 'Invalid Credentials'
      });
    }

    const { id, name } = user;

    return res.json({
      user: {
        id,
        name,
        email
      },
      token: JWT.sign(
        {
          id
        },
        process.env.JWT_SECRET,
        {
          expiresIn: '7d'
        }
      )
    });
  }
}

export default new SessionController();
