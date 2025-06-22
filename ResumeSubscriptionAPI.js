app.put('/subscription/resume/:userId', async (req, res) => {
    try {
        const subscription = await Subscription.findOne({ userId: req.params.userId });
        if (!subscription || subscription.status !== 'Paused') {
            return res.status(400).json({ message: 'Subscription cannot be resumed' });
        }

        subscription.status = 'Active';
        subscription.resumedAt = new Date();
        await subscription.save();

        res.json({ message: 'Subscription resumed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error resuming subscription', error });
    }
});

async function resumeSubscription(subscriptionId) {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
        pause_collection: ''
    });
    console.log('Subscription resumed:', subscription.id);
}

resumeSubscription('sub_12345');
