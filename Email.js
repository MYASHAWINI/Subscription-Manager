1. Configure Email Service

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail', // Use your email provider
    auth: {
        user: process.env.EMAIL_USER, // Your email
        pass: process.env.EMAIL_PASS  // App password
    }
});

2. Send Email Notifications

async function sendEmail(userEmail, subject, message) {
    const mailOptions = {
        from: '"Subscription Manager" <your-email@gmail.com>',
        to: userEmail,
        subject: subject,
        text: message
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

app.put('/subscription/pause/:userId', async (req, res) => {
    try {
        const subscription = await Subscription.findOne({ userId: req.params.userId }).populate('userId');
        if (!subscription || subscription.status !== 'Active') {
            return res.status(400).json({ message: 'Subscription cannot be paused' });
        }

        subscription.status = 'Paused';
        subscription.pausedAt = new Date();
        await subscription.save();

        await sendEmail(subscription.userId.email, 'Subscription Paused', 
            `Your subscription has been paused. Resume anytime in your account.`);

        res.json({ message: 'Subscription paused successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error pausing subscription', error });
    }
});

2. Create Email Templates

<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #007bff; color: white; padding: 10px; text-align: center; }
        .content { padding: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Subscription Paused</h2>
        </div>
        <div class="content">
            <p>Hi {{name}},</p>
            <p>Your subscription for <strong>{{plan}}</strong> has been paused.</p>
            <p>You can resume anytime from your account dashboard.</p>
            <p>Thank you for using our service!</p>
        </div>
    </div>
</body>
</html>

4. Load and Compile Templates

const fs = require('fs');
const handlebars = require('handlebars');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

async function sendTemplateEmail(userEmail, templateName, subject, data) {
    const templatePath = `./templates/${templateName}.hbs`;
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const compiledTemplate = handlebars.compile(templateSource);
    const htmlContent = compiledTemplate(data);

    const mailOptions = {
        from: '"Subscription Manager" <your-email@gmail.com>',
        to: userEmail,
        subject: subject,
        html: htmlContent
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent: ${subject}`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

app.put('/subscription/pause/:userId', async (req, res) => {
    const subscription = await Subscription.findOne({ userId: req.params.userId }).populate('userId');
    if (!subscription || subscription.status !== 'Active') return res.status(400).json({ message: 'Subscription cannot be paused' });

    subscription.status = 'Paused';
    subscription.pausedAt = new Date();
    await subscription.save();

    await sendTemplateEmail(subscription.userId.email, 'pause_subscription', 'Subscription Paused', {
        name: subscription.userId.name,
        plan: subscription.plan
    });

    res.json({ message: 'Subscription paused successfully' });
});

5. Trigger Emails for Pause/Resume

app.put('/subscription/pause/:userId', async (req, res) => {
    try {
        const subscription = await Subscription.findOne({ userId: req.params.userId }).populate('userId');
        if (!subscription || subscription.status !== 'Active') {
            return res.status(400).json({ message: 'Subscription cannot be paused' });
        }

        subscription.status = 'Paused';
        subscription.pausedAt = new Date();
        await subscription.save();

        await sendEmail(subscription.userId.email, 'Subscription Paused', 
            `Your subscription has been paused. Resume anytime in your account.`);

        res.json({ message: 'Subscription paused successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error pausing subscription', error });
    }
});

app.put('/subscription/resume/:userId', async (req, res) => {
    try {
        const subscription = await Subscription.findOne({ userId: req.params.userId }).populate('userId');
        if (!subscription || subscription.status !== 'Paused') {
            return res.status(400).json({ message: 'Subscription cannot be resumed' });
        }

        subscription.status = 'Active';
        subscription.resumedAt = new Date();
        await subscription.save();

        await sendEmail(subscription.userId.email, 'Subscription Resumed', 
            `Your subscription has been resumed. Enjoy uninterrupted service.`);

        res.json({ message: 'Subscription resumed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error resuming subscription', error });
    }
});

app.put('/subscription/resume/:userId', async (req, res) => {
    const subscription = await Subscription.findOne({ userId: req.params.userId }).populate('userId');
    if (!subscription || subscription.status !== 'Paused') return res.status(400).json({ message: 'Subscription cannot be resumed' });

    subscription.status = 'Active';
    subscription.resumedAt = new Date();
    await subscription.save();

app.put('/subscription/pause/:userId', async (req, res) => {
    const subscription = await Subscription.findOne({ userId: req.params.userId }).populate('userId');
    if (!subscription || subscription.status !== 'Active') return res.status(400).json({ message: 'Subscription cannot be paused' });

    subscription.status = 'Paused';
    subscription.pausedAt = new Date();
    await subscription.save();

   res.json({ message: 'Subscription paused successfully' });

});
    await sendTemplateEmail(subscription.userId.email, 'resume_subscription', 'Subscription Resumed', {
        name: subscription.userId.name,
        plan: subscription.plan
    });

    res.json({ message: 'Subscription resumed successfully' });
});
