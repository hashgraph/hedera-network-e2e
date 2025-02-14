// SPDX-License-Identifier: Apache-2.0

import Dockerode from 'dockerode';
import shell from 'shelljs';
import semver from'semver';
import fs from 'fs';
import {
    IS_WINDOWS, NECESSARY_PORTS, UNKNOWN_VERSION, OPTIONAL_PORTS, MIN_CPUS,
    MIN_MEMORY_MULTI_MODE, MIN_MEMORY_SINGLE_MODE, RECOMMENDED_CPUS,
    RECOMMENDED_MEMORY_SINGLE_MODE, CHECK_SUCCESS, CHECK_FAIL, LOADING,
    SHARED_PATHS_ERROR, DOCKER_PULLING_IMAGES_MESSAGE, MOUNT_ERROR,
} from '../constants';
import { IService } from './IService';
import { LoggerService } from './LoggerService';
import { ServiceLocator } from './ServiceLocator';
import detectPort from 'detect-port';
import * as dotenv from 'dotenv';
import { CLIOptions } from '../types/CLIOptions';
import path from 'path';
import { SafeDockerNetworkRemover } from '../utils/SafeDockerNetworkRemover';
import yaml from 'js-yaml';

dotenv.config();

/**
 * DockerService is a service class that handles Docker-related operations.
 * It implements the IService interface.
 * It uses the 'dockerode' library to interact with Docker, 'shelljs' to execute shell commands, and 'semver' to compare semantic versioning numbers.
 */
export class DockerService implements IService{
    /**
     * The logger service used for logging.
     * @private
     */
    private logger: LoggerService;

    /**
     * The name of the service.
     * @private
     */
    private serviceName: string;

    /**
     * The Docker socket path.
     * @private
     */
    private dockerSocket: string;

    /**
     * Constructs a new instance of the DockerService.
     * Initializes the logger and Docker socket path.
     */
    constructor() {
        this.serviceName = DockerService.name;
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.logger.trace(`${CHECK_SUCCESS} Docker Service Initialized!`, this.serviceName);

        const defaultSocketPath = IS_WINDOWS
        ? '//./pipe/docker_engine'
        : '/var/run/docker.sock';

        this.dockerSocket = process.env.DOCKER_SOCKET || defaultSocketPath;
    }

    /**
     * Returns the Docker socket path.
     * 
     * @public
     * @returns {string} - The Docker socket path.
     */
    public getDockerSocket(): string {
        return this.dockerSocket;
    }

    /**
     * Returns the null output path depending on the operating system.
     *
     * @public
     * @returns {string} - The null output path.
     */
    public getNullOutput(): "null" | "/dev/null" {
        if (IS_WINDOWS) return 'null';
        return '/dev/null';
    }

    /**
     * Checks if Docker is running.
     * 
     * @public
     * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating whether Docker is running.
     */
    public async checkDocker (): Promise<boolean> {
        let isRunning = false;
    
        const docker = new Dockerode({ socketPath: this.dockerSocket });
        await docker
          .info()
          .then(() => {
            this.logger.trace(`${CHECK_SUCCESS} Docker is running.`, this.serviceName);
            isRunning = true;
          })
          .catch(() => {
            this.logger.error(`${CHECK_FAIL} Docker is not running.`, this.serviceName);
            isRunning = false;
          });
        return isRunning;
    }

    /**
     * Checks if the provided ports are in use.
     * If necessary ports are in use, it terminates the process.
     * 
     * @param {number[]} portsToCheck - The ports to check.
     * @public
     * @returns {Promise<void>} - A promise that resolves when the ports are checked.
     * @throws If an error occurs during the port check.
     */
    public async isPortInUse (portsToCheck: number[]): Promise<void> {
      const promises: Promise<boolean>[] = portsToCheck.map((port:number) => detectPort(port)
        .then((available: number) => available !== port)
        .catch((error: Error) => {
          // Handle the error
          throw error;
        }));

      const resolvedPromises: boolean[] = await Promise.all(promises);
      resolvedPromises.forEach((result, index) => {
        const port = portsToCheck[index];
        if (result && OPTIONAL_PORTS.includes(port)) {
          this.logger.warn(`Port ${port} is in use.`, this.serviceName); 
        } else if (result && NECESSARY_PORTS.includes(port)) {
          this.logger.error(`${CHECK_FAIL} Port ${port} is in use.`, this.serviceName); 
        }
      });

      const resolvedPromisesNecessaryPortsOnly = resolvedPromises.slice(0, NECESSARY_PORTS.length);

      if(!(resolvedPromisesNecessaryPortsOnly.every(value => value === false))) {
        this.logger.error(`${CHECK_FAIL} Node cannot start properly because necessary ports are in use!`, this.serviceName);
        process.exit(1);
      }
    }

    /**
     * Checks if the installed Docker Compose version is correct (greater than 2.12.2).
     * 
     * @public
     * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating whether the Docker Compose version is correct.
     */
    public async isCorrectDockerComposeVersion (): Promise<boolean> {
        this.logger.info(`${LOADING} Checking docker compose version...`, this.serviceName);
        // We are executing both commands because in Linux we may have docker-compose v2, so we need to check both
        const resultFirstCommand = await shell.exec(
          'docker compose version --short',
          { silent: true }
        );
        const resultSecondCommand = await shell.exec(
          'docker-compose version --short',
          { silent: true }
        );
    
        // Exit code is 127 when no docker installation is found
        if (resultFirstCommand.code === 127 && resultSecondCommand.code === 127) {
            this.logger.error(`Please install docker compose V2.`, this.serviceName);
        } else if (
          resultFirstCommand.code === 127 &&
          resultSecondCommand.code === 0
        ) {
            this.logger.error(
            `Looks like you have docker-compose V1, but you need docker compose V2!`,
            this.serviceName
          );
        } else {
          const version = resultFirstCommand.stdout
            ? resultFirstCommand.stdout
            : resultSecondCommand.stdout;
          if (semver.gt(version, '2.12.2')) {
            // Docker version is OK
            return true;
          }
          this.logger.error(
            'You are using docker compose version prior to 2.12.2, please upgrade',
            this.serviceName
          );
        }
        return false;
    }

    public async checkDockerResources(isMultiNodeMode: boolean) {
      this.logger.info(`${LOADING} Checking docker resources...`, this.serviceName);

      const ncpu = await shell.exec(
          "docker info --format='{{.NCPU}}'",
          { silent: true }
      );

      const memTotal = await shell.exec(
          "docker info --format='{{.MemTotal}}'",
          { silent: true }
      );
      
      const dockerMemory = Math.round(parseInt(memTotal) / Math.pow(1024, 3));
      const dockerCPUs = parseInt(ncpu);

      return this.checkMemoryResources(dockerMemory, isMultiNodeMode) &&
      this.checkCPUResources(dockerCPUs);
    }

    public checkDockerImages() {
        const dockerComposeYml = yaml.load(shell.exec("docker compose config", { silent: true }).stdout) as any;
        const dockerComposeImages = Object.values(dockerComposeYml.services).map((s: any) => {
            const parsed = s.image.split(":");
            return `${parsed[0]}:${parsed[1] ?? "latest"}`;
        });
        const dockerComposeImagesUnique = [...new Set(dockerComposeImages.sort())];

        const dockerImagesString = shell.exec("docker images", { silent: true }).stdout.split(/\r?\n/).slice(1, -1);
        const dockerImages = dockerImagesString.map(line => {
            const parsed = line.replace(/\s\s+/g, " ").split(" ");
            return `${parsed[0]}:${parsed[1]}`;
        });
        const dockerImagesUnique = [...new Set(dockerImages.sort())];

        if (!dockerImages.length || dockerComposeImagesUnique.toString() != dockerImagesUnique.toString()) {
            this.logger.info(DOCKER_PULLING_IMAGES_MESSAGE, this.serviceName);
        }
    }

    private checkMemoryResources(dockerMemory: number, isMultiNodeMode: boolean) {
      if ((dockerMemory >= MIN_MEMORY_SINGLE_MODE && dockerMemory < RECOMMENDED_MEMORY_SINGLE_MODE && !isMultiNodeMode) ||
          (dockerMemory < MIN_MEMORY_SINGLE_MODE && !isMultiNodeMode) ||
          (dockerMemory < MIN_MEMORY_MULTI_MODE && isMultiNodeMode))
        {
          if (dockerMemory < MIN_MEMORY_SINGLE_MODE) {
              this.handleMemoryError(dockerMemory, isMultiNodeMode);
          } else {
              this.logger.warn(`Your docker memory resources are ${dockerMemory.toFixed(2)}GB, which may cause unstable behaviour. Set to at least ${isMultiNodeMode ? MIN_MEMORY_MULTI_MODE : RECOMMENDED_MEMORY_SINGLE_MODE}GB`, this.serviceName);
              return true;
          }
          return false;
        }

      return true;
    }

    private checkCPUResources(dockerCPUs: number) {
      if(dockerCPUs >= MIN_CPUS && dockerCPUs < RECOMMENDED_CPUS && !process.env.CI) {
        this.logger.warn(`Your docker CPU resources are set to ${dockerCPUs}, which may cause unstable behaviour. Set to at least ${RECOMMENDED_CPUS} CPUs`, this.serviceName);
        return true;
      } else if (dockerCPUs < MIN_CPUS && !process.env.CI) {
        this.logger.error(`Your docker CPU resources are set to ${dockerCPUs}. This is not enough, set to at least ${RECOMMENDED_CPUS} CPUs`, this.serviceName);
        return false;
      }

      return true;
    }

    private handleMemoryError(dockerMemory: number, isMultiNodeMode: boolean) {
      const recommendedMemory = isMultiNodeMode ? MIN_MEMORY_MULTI_MODE : MIN_MEMORY_SINGLE_MODE;
      this.logger.error(`Your docker memory resources are set to ${dockerMemory.toFixed(2)}GB. This is not enough, set to at least ${recommendedMemory}GB`, this.serviceName);
    }

    private logShellOutput(shellExec: any) {
        [shellExec.stdout, shellExec.stderr].forEach( (output: string) => {
            output.split("\n").map((line: string) => {
                if (line.indexOf(SHARED_PATHS_ERROR) > -1 || line.indexOf(MOUNT_ERROR) > -1) {
                    this.logger.error(`Hedera local node start up TERMINATED due to docker's misconfiguration`);
                    this.logger.error(SHARED_PATHS_ERROR);
                    this.logger.error(`See https://docs.docker.com/desktop/settings/mac/#file-sharing for more info.`);
                    this.logger.error(`-- Make sure you have '/Users/<your_user>/Library/' under File Sharing Docker's Setting.`);
                    this.logger.error(`-- If you're using hedera-local as npm package - running 'npm root -g' should output the path you have to add under File Sharing Docker's Setting.`);
                    this.logger.error(`-- If you're using hedera-local as cloned repo - running 'pwd' in the project's root should output the path you have to add under File Sharing Docker's Setting.`);
                    process.exit();
                }
                if (line === "") return;
                this.logger.debug(line, this.serviceName);
            });
        });
    }

    private async executeExternal(command: string, options = {}): Promise<shell.ShellString> {
        this.logger.trace(`🚀 Executing command: ${command}`, this.serviceName);
        const shellExec = shell.exec(command, options);
        this.logShellOutput(shellExec);
        return shellExec;
    }

    /**
     * Returns a Docker container object for the given container label.
     * 
     * @param {string} containerLabel - The label of the container.
     * @returns {Promise<Dockerode.Container>} - A promise that resolves to a Docker container object.
     * @public
     */
    public async getContainer(containerLabel: string): Promise<Dockerode.Container> {
      const containerId = await this.getContainerId(containerLabel) as string;
      const docker = new Dockerode({
        socketPath: this.getDockerSocket(),
      });
      return docker.getContainer(containerId);
    }

    /**
     * Returns the ID of the Docker container with the given name.
     * 
     * @param {string} name - The name of the container.
     * @returns {Promise<string>} - A promise that resolves to the ID of the Docker container.
     * @public
     */
    public async getContainerId (name: string): Promise<string> {
        const docker = new Dockerode({ socketPath: this.dockerSocket });
        const opts = {
          limit: 1,
          filters: { name: [`${name}`] }
        };
    
        return new Promise((resolve, reject) => {
          docker.listContainers(opts, (err, containers) => {
            if (err) {
              reject(err);
            } else {
              resolve(containers![0].Id);
            }
          });
        });
    }
    
    /**
     * Returns the version of the Docker container with the given name.
     * 
     * @param {string} name - The name of the container.
     * @returns {Promise<string>} - A promise that resolves to the version of the Docker container.
     * @public
     * @async
     */
    public async getContainerVersion (name: string): Promise<string> {
        const docker = new Dockerode({ socketPath: this.dockerSocket });
        const opts = {
          limit: 1,
          filters: { name: [`${name}`] }
        };
    
        return new Promise((resolve, reject) => {
          docker.listContainers(opts, (err, containers) => {
            if (err) {
              reject(err);
            } else {
              try {
                resolve(containers![0].Image.split(':')[1]);
              } catch (e) {
                resolve(UNKNOWN_VERSION);
              }
            }
          });
        });
    }

    /**
     * Executes the docker compose up command.
     * 
     * @private
     * @returns {Promise<shell.ShellString>} A promise that resolves with the output of the command.
     */
    public async dockerComposeUp(cliOptions: CLIOptions): Promise<shell.ShellString> {
      // TODO: Add multi node option
      const composeFiles = ['docker-compose.yml'];
      const { fullMode } = cliOptions;
      const { userCompose } = cliOptions;
      const { userComposeDir } = cliOptions;
      const { multiNode } = cliOptions;

      if (!fullMode) {
          composeFiles.push('docker-compose.evm.yml');
      }

      if (multiNode) {
          composeFiles.push('docker-compose.multinode.yml');
      }

      if (!fullMode && multiNode) {
          composeFiles.push('docker-compose.multinode.evm.yml');
      }

      if (userCompose) {
          composeFiles.push(...this.getUserComposeFiles(userComposeDir));
      }

      return this.executeExternal(`docker compose -f ${composeFiles.join(' -f ')} up -d`, {silent: true});
    }

    /**
     *  Retrieves an array of user compose files from the specified directory.
     * 
     * @private
     * @param {string} userComposeDir - The directory path where the user compose files are located. Defaults to './overrides/'.
     * @returns {Array<string>} An array of user compose file paths.
     */
    private getUserComposeFiles(userComposeDir: string = './overrides/'): Array<string> {
        let dirPath = path.normalize(userComposeDir);
        if (!dirPath.endsWith(path.sep)) {
          dirPath += path.sep;
        }
        if (fs.existsSync(dirPath)) {
          const files = fs
            .readdirSync(dirPath)
            .filter((file) => path.extname(file).toLowerCase() === '.yml')
            .sort()
            .map((file) => dirPath.concat(file));
          return files;
        } 
          return [];
    }

    /**
     * Tries to recover the state by performing Docker recovery steps.
     * Stops the docker containers, cleans volumes and temp files, and tries to startup again.
     * @returns {Promise<void>} A promise that resolves when the recovery steps have completed.
     */
    public async tryDockerRecovery(stateName: string): Promise<void> {
        const nullOutput = this.getNullOutput();
        this.logger.trace('Stopping the docker containers...', stateName);
        this.executeExternal(`docker compose kill --remove-orphans`, {silent: true});
        this.executeExternal(`docker compose down -v --remove-orphans`, {silent: true});
        this.logger.trace('Cleaning the volumes and temp files...', stateName);
        shell.exec(`rm -rf network-logs/* >${nullOutput} 2>&1`);
        SafeDockerNetworkRemover.removeAll();
        this.logger.info(`${LOADING} Trying to startup again...`, stateName);
    }
}
