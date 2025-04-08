// SPDX-License-Identifier: Apache-2.0

export const CONTAINERS = [
    {
        name: "Consensus Node",
        label: "network-node",
        port: 50211,
    },
    {
        name: "Mirror Node",
        label: "mirror-node-grpc",
        port: 5600,
    },
    {
        name: "Relay",
        label: "json-rpc-relay",
        port: 7546,
    },
];

export const SDK_ERRORS = {
    FAILED_TO_FIND_A_HEALTHY_NODE: "failed to find a healthy working node",
}

export const NETWORK_PREFIX = 'hedera-';

export const CONSENSUS_NODE_LABEL = "network-node";
export const MIRROR_NODE_LABEL = "mirror-node-rest";
export const RELAY_LABEL = "json-rpc-relay";
export const IS_WINDOWS = process.platform === "win32";
export const UNKNOWN_VERSION = "Unknown";
export const NECESSARY_PORTS = [5551, 8545, 5600, 5433, 50211, 8082, 6379];
export const OPTIONAL_PORTS = [7546, 8080, 3000];
export const EVM_ADDRESSES_BLOCKLIST_FILE_RELATIVE_PATH = '../../compose-network/network-node'
export const NETWORK_NODE_CONFIG_DIR_PATH = 'compose-network/network-node/data/config';
export const APPLICATION_YML_RELATIVE_PATH = 'compose-network/mirror-node/application.yml';
export const MIN_MEMORY_SINGLE_MODE = 4;
export const MIN_MEMORY_MULTI_MODE = 14;
export const RECOMMENDED_MEMORY_SINGLE_MODE = 8;
export const MIN_CPUS = 4;
export const RECOMMENDED_CPUS = 6;

//Logger Colors for the terminal logging
// reset / black
export const COLOR_RESET = '\x1b[0m'
// bright / white
export const COLOR_DIM = '\x1b[2m'
// red
export const ERROR_COLOR = '\x1b[31m'
// yellow
export const WARNING_COLOR = '\x1b[33m'
// green
export const INFO_COLOR = '\x1b[32m'
// cyan
export const DEBUG_COLOR = '\x1b[36m'
// white
export const TRACE_COLOR = '\x1b[37m'

// check success
export const CHECK_SUCCESS = `${INFO_COLOR}[✔︎]${COLOR_RESET}`
// check warn
export const CHECK_WARN = `${WARNING_COLOR}[!]${COLOR_RESET}`
// check fail
export const CHECK_FAIL = `${ERROR_COLOR}[✘]${COLOR_RESET}`
// waiting
export const LOADING = `⏳`;

// Start State
export const START_STATE_INIT_MESSAGE = `${CHECK_SUCCESS} Start State Initialized!`;
export const START_STATE_STARTING_MESSAGE = `${LOADING} Starting Hedera Local Node...`;
export const START_STATE_ON_START_MESSAGE = `${LOADING} Initiating start procedure. Trying to start docker containers...`;
export const START_STATE_STARTED_DETECTING = `${LOADING} Detecting network...`;
export const START_STATE_STARTED_MESSAGE = `${CHECK_SUCCESS} Hedera Local Node successfully started!`;

// Stop State
export const STOP_STATE_INIT_MESSAGE = `${CHECK_SUCCESS} Stop State Initialized!`;
export const STOP_STATE_ON_START_MESSAGE = `${LOADING} Initiating stop procedure. Trying to stop docker containers and clean up volumes...`;
export const STOP_STATE_STOPPING_MESSAGE = `${LOADING} Stopping the network...`;
export const STOP_STATE_STOPPED_MESSAGE = `${CHECK_SUCCESS} Hedera Local Node was stopped successfully.`;

// Docker commands
export const DOCKER_STOPPING_CONTAINERS_MESSAGE = `${LOADING} Stopping the docker containers...`;
export const DOCKER_PULLING_IMAGES_MESSAGE = `${LOADING} Pulling docker images...`;
export const DOCKER_CLEANING_VOLUMES_MESSAGE = `${LOADING} Cleaning the volumes and temp files...`;

// Recovery state
export const RECOVERY_STATE_INIT_MESSAGE = `${CHECK_SUCCESS} Recovery State Initialized!`;
export const RECOVERY_STATE_STARTING_MESSAGE = `${LOADING} Starting Recovery State...`;

// Network Prep State
export const NETWORK_PREP_STATE_INIT_MESSAGE = `${CHECK_SUCCESS} Network Preparation State Initialized!`;
export const NETWORK_PREP_STATE_STARTING_MESSAGE = `${LOADING} Starting Network Preparation State...`;
export const NETWORK_PREP_STATE_IMPORT_FEES_START = `${LOADING} Starting Fees import...`;
export const NETWORK_PREP_STATE_IMPORT_FEES_END = `${CHECK_SUCCESS} Imported fees successfully!`;
export const NETWORK_PREP_STATE_WAITING_TOPIC_CREATION = `${LOADING} Waiting for topic creation...`;
export const NETWORK_PREP_STATE_TOPIC_CREATED = `${CHECK_SUCCESS} Topic was created!`;

// Init state
export const INIT_STATE_INIT_MESSAGE = `${CHECK_SUCCESS} Initialization State Initialized!`;
export const INIT_STATE_STARTING_MESSAGE = `${CHECK_SUCCESS} Initialization State Starting...`;
export const INIT_STATE_START_DOCKER_CHECK = `${LOADING} Making sure that Docker is started and it is correct version...`;
export const INIT_STATE_CONFIGURING_ENV_VARIABLES_FINISH = `${CHECK_SUCCESS} Needed environment variables were set for this configuration.`;
export const INIT_STATE_RELAY_LIMITS_DISABLED = `${CHECK_SUCCESS} Hedera JSON-RPC Relay rate limits were disabled.`;
export const INIT_STATE_BOOTSTRAPPED_PROP_SET = `${CHECK_SUCCESS} Needed bootsrap properties were set for this configuration.`;
export const INIT_STATE_MIRROR_PROP_SET = `${CHECK_SUCCESS} Needed mirror node properties were set for this configuration.`;
export const INIT_STATE_NO_NODE_CONF_NEEDED = `${CHECK_SUCCESS} No additional node configuration needed.`;
export const INIT_STATE_NO_ENV_VAR_CONFIGURED = `${CHECK_SUCCESS} No new environment variables were configured.`;

// StateController
export const STATE_CONTROLLER_MISSING_STATE_CONFIG_ERROR = `${CHECK_FAIL} Something is wrong with state configuration!`;

// Account Creation State
export const ACCOUNT_CREATION_STATE_INIT_MESSAGE = `${CHECK_SUCCESS} Account Creation State Initialized!`;
export const ACCOUNT_CREATION_STARTING_SYNCHRONOUS_MESSAGE = `${LOADING} Starting Account Creation state in synchronous mode...`;
export const ACCOUNT_CREATION_STARTING_ASYNCHRONOUS_MESSAGE = `${LOADING} Starting Account Creation state in asynchronous mode...`;
export const ACCOUNT_CREATION_STARTING_ASYNCHRONOUS_BLOCKLIST_MESSAGE = `${LOADING} Starting Account Creation state in asynchronous mode with 1 blocklisted accounts...`;
export const ACCOUNT_CREATION_FINISHED = `${CHECK_SUCCESS} Accounts created successfully!`;

// Resource Creation State
export const RESOURCE_CREATION_STATE_INIT_MESSAGE = `${CHECK_SUCCESS} Resource Creation State Initialized!`;
export const RESOURCE_CREATION_STARTING_SYNCHRONOUS_MESSAGE = `${LOADING} Starting Resource Creation state in synchronous mode...`;
export const RESOURCE_CREATION_STARTING_ASYNCHRONOUS_MESSAGE = `${LOADING} Starting Resource Creation state in asynchronous mode...`;

// Docker messages
export const SHARED_PATHS_ERROR = `You can configure shared paths from Docker -> Preferences... -> Resources -> File Sharing.`;
export const MOUNT_ERROR = `: error mounting`;
