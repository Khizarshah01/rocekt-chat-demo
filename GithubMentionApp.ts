import {
    IConfigurationExtend,
    IEnvironmentRead,
    IAppAccessors,
    ILogger
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { Mention } from './slashCommands/mention';
import { IPostMessageSent } from '@rocket.chat/apps-engine/definition/messages';
import {
    RocketChatAssociationModel,
    RocketChatAssociationRecord,
} from '@rocket.chat/apps-engine/definition/metadata';

export class GithubMentionApp extends App implements IPostMessageSent {
    private readonly appLogger: ILogger

    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors)
        this.appLogger = this.getLogger()
        this.appLogger.debug('Hello, World!')
    }

    protected async extendConfiguration(configuration: IConfigurationExtend, environmentRead: IEnvironmentRead): Promise<void> {
        await configuration.slashCommands.provideSlashCommand(new Mention());
    }

    public async executePostMessageSent(message, read, http, persistence, modify) {
        const mentions = message.msg;

        if (!mentions || mentions.length === 0) {
            return;
        }

        const mentionedUser = mentions.match(/@khizarshah01/);

        if (!mentionedUser) {
            return;
        }

        const association = new RocketChatAssociationRecord(
            RocketChatAssociationModel.USER,
            message.sender.id
        );

        const records = await read.getPersistenceReader().readByAssociation(association);

        if (!records.length || !records[0].enabled) {
            return;
        }

        const fullMessage = message.text;

        this.appLogger.debug(`message: ${fullMessage}`);

        const notifier = read.getNotifier();
        const builder = notifier.getMessageBuilder();

        builder
            .setRoom(message.room)
            .setText(`Thank you for mentioning me, ${message.sender.username}`);

        await notifier.notifyUser(message.sender, builder.getMessage());
    }
}
