import { Op } from 'sequelize';

import Subscription from '../models/Subscription';
import Meetup from '../models/Meetup';
import User from '../models/User';

class SubscriptionController {
  async index(req, res) {
    const subscriptions = await Subscription.findAll({
      where: {
        user_id: req.userId
      },
      include: [
        {
          model: Meetup,
          where: {
            date: {
              [Op.gt]: new Date()
            }
          },
          required: true
        }
      ],
      order: [[Meetup, 'date']]
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

    const meetup = await Meetup.findByPk(req.params.id);

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

    // await Queue.add(SubscriptionMail.key, {
    //   meetup,
    //   user,
    // });

    return res.json(subscription);
  }
}

export default new SubscriptionController();
