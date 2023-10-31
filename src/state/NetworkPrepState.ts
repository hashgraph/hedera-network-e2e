/*-
 *
 * Hedera Local Node
 *
 * Copyright (C) 2023 Hedera Hashgraph, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

import { Client, FileContentsQuery } from '@hashgraph/sdk';
import shell from 'shelljs';
import { IOBserver } from '../controller/IObserver';
import { ClientService } from '../services/ClientService';
import { LoggerService } from '../services/LoggerService';
import { ServiceLocator } from '../services/ServiceLocator';
import { EventType } from '../types/EventType';
import { IState } from './IState';
import { DockerService } from '../services/DockerService';

export class NetworkPrepState implements IState{
    private logger: LoggerService;

    private clientService: ClientService;

    private dockerService: DockerService;

    private observer: IOBserver | undefined;

    private stateName: string;
    
    constructor() {
        this.stateName = NetworkPrepState.name;
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.clientService = ServiceLocator.Current.get<ClientService>(ClientService.name);
        this.dockerService = ServiceLocator.Current.get<DockerService>(DockerService.name);
        this.logger.trace('Network Preparation State Initialized!', this.stateName);
    }

    public subscribe(observer: IOBserver): void {
        this.observer = observer;
    }

    public async onStart(): Promise<void> {
        this.logger.info('Starting Network Preparation State...', this.stateName);
        const client = this.clientService.getClient();

        await this.importFees(client);
        await this.waitForTopicCreation();

        this.observer!.update(EventType.Finish);
    }

    private async importFees(client: Client): Promise<void> {
        this.logger.trace('Starting Fees import...', this.stateName);

        const feesFileId = 111;
        const exchangeRatesFileId = 112;

        const timestamp = Date.now();
        const nullOutput = this.dockerService.getNullOutput();

        const queryFees = new FileContentsQuery().setFileId(
          `0.0.${feesFileId}`
        );
        const fees = Buffer.from(await queryFees.execute(client)).toString('hex');
        await shell.exec(
          `docker exec mirror-node-db psql mirror_node -U mirror_node -c "INSERT INTO public.file_data(file_data, consensus_timestamp, entity_id, transaction_type) VALUES (decode('${fees}', 'hex'), ${
            timestamp + '000000'
          }, ${feesFileId}, 17);" >> ${nullOutput}`
        );
    
        const queryExchangeRates = new FileContentsQuery().setFileId(
          `0.0.${exchangeRatesFileId}`
        );
        const exchangeRates = Buffer.from(await queryExchangeRates.execute(client)).toString('hex');
        await shell.exec(
          `docker exec mirror-node-db psql mirror_node -U mirror_node -c "INSERT INTO public.file_data(file_data, consensus_timestamp, entity_id, transaction_type) VALUES (decode('${exchangeRates}', 'hex'), ${
            timestamp + '000001'
          }, ${exchangeRatesFileId}, 17);" >> ${nullOutput}`
        );

        this.logger.info('Imported fees successfully', this.stateName);
    }

    /**
     * Mirror Node Monitor creates a Topic Entity. 
     * If that happens during the account generation step all consecutive AccountIds 
     * get shifted by 1 and the private keys no longer correspond to the expected AccountIds.
     */
    private async waitForTopicCreation(): Promise<void> {
        this.logger.trace('Waiting for topic creation...', this.stateName);
        const LOG_SEARCH_TEXT = 'Created TOPIC entity';

        return new Promise((resolve, reject) => {
          const command = shell.exec('docker logs mirror-node-monitor -f', {
            silent: true,
            async: true
          });
          command.stdout!.on('data', (data) => {
            if (data.indexOf(LOG_SEARCH_TEXT) !== -1) {
              command.kill('SIGINT');
              command.stdout!.destroy();
              this.logger.info('Topic was created!', this.stateName);
              resolve();
            }
          });
        });
    }
}
// this state waits for topics and uploads fees