import { Op } from 'sequelize';

import Subscription from '../models/Subscription';
import File from '../models/File';
import Meetup from '../models/Meetup';
import User from '../models/User';
import Queue from '../../lib/Queue';
import SubscriptionMail from '../jobs/SubscriptionMail';

class SubscriptionController {
  async index(req, res) {
    const subscriptions = await Subscription.findAll({
      where: {
        user_id: req.userId
      },
      include: [
        {
          model: Meetup,
          as: 'meetup',
          where: {
            date: {
              [Op.gt]: new Date()
            }
          },
          include: [
            { model: File, as: 'banner' },
            { model: User, as: 'user', attributes: ['name'] }
          ]
        }
      ],
      order: [['meetup', 'date']]
    });

    return res.json(subscriptions);
  }

  async store(req, res) {
    const existingSubscription = await Subscription.findOne({
      where: {
        user_id: req.userId,
        meetup_id: req.params.id
      }
    });
    if (existingSubscription) {
      return res.status(400).json({ error: 'Already subscribed' });
    }

    const meetup = await Meetup.findByPk(req.params.id, {
      include: [{ model: User, as: 'user' }]
    });

    if (meetup.user_id === req.userId) {
      return res
        .status(400)
        .json({ error: "Can't subscribe to your own Meetup" });
    }

    if (meetup.past) {
      return res.status(400).json({ error: 'Meetup already happened' });
    }

    const dateHasSubscription = await Subscription.findOne({
      where: {
        user_id: req.userId
      },
      include: [
        {
          model: Meetup,
          as: 'meetup',
          required: true,
          where: {
            date: meetup.date
          }
        }
      ]
    });
    if (dateHasSubscription) {
      return res.status(400).json({
        error: 'You already subscribed to a Meetup happening on this same date'
      });
    }

    const user = await User.findByPk(req.userId);

    const subscription = await Subscription.create({
      user_id: user.id,
      meetup_id: meetup.id
    });

    await Queue.add(SubscriptionMail.key, {
      meetup,
      user
    });

    return res.json(subscription);
  }

  async delete(req, res) {
    const subscription = await Subscription.findByPk(req.params.id);

    if (subscription.user_id !== req.userId) {
      return res.status(403).json({
        error: 'Cannot cancel another user subscription'
      });
    }

    await Subscription.destroy({ where: { id: req.params.id } });

    return res.json({ message: 'successfully canceled' });
  }
}

export default new SubscriptionController();
