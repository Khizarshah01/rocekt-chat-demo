import {
    IConfigurationExtend,
    IEnvironmentRead,
    IAppAccessors,
    ILogger, IRead, IHttp, IModify, IPersistence
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { Mention } from './slashCommands/mention';
import { IPostMessageSent, IMessage } from '@rocket.chat/apps-engine/definition/messages';
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

    public async checkPostMessageSent(message: IMessage, read: IRead, http: IHttp): Promise<boolean> {
        if (!message.text) {
            return false;
        }
        return message.text.includes('@khizarshah01');
    }

    public async executePostMessageSent(message: IMessage, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify) {
        const association = new RocketChatAssociationRecord(
            RocketChatAssociationModel.USER,
            message.sender.id
        );

        const records = await read.getPersistenceReader().readByAssociation(association);

        if (!records.length || !(records[0] as any).enabled) {
            return;
        }

        const notifier = read.getNotifier();
        const builder = notifier.getMessageBuilder();

        builder
            .setRoom(message.room)
            .setText(`Thank you for mentioning me, @${message.sender.username}`);

        await notifier.notifyUser(message.sender, builder.getMessage());
    }
}
