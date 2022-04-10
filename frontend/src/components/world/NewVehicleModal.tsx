import {
Button,
FormControl,
FormLabel,
Input,
Modal,
ModalBody,
ModalCloseButton,
ModalContent,
ModalFooter,
ModalHeader,
ModalOverlay,

useToast
} from '@chakra-ui/react';
import React,{ useCallback,useState } from 'react';
import ConversationArea from '../../classes/ConversationArea';
import Vehicle from '../../classes/Vehicle';
import useCoveyAppState from '../../hooks/useCoveyAppState';
import useMaybeVideo from '../../hooks/useMaybeVideo';


type NewVehicleModalProps = {
    isOpen: boolean;
    closeModal: ()=>void;
    newVehicle: Vehicle;
    playerID: string;
}
export default function NewVehicleModal( {isOpen, closeModal, newVehicle, playerID} : NewVehicleModalProps): JSX.Element {
    const [topic, setTopic] = useState<string>('');
    const {apiClient, sessionToken, currentTownID} = useCoveyAppState();

    const toast = useToast()
    const video = useMaybeVideo()

    const createVehicle = useCallback(async () => {
        if (topic) {
            const conversationToCreate = newVehicle.conversationArea;
            conversationToCreate.topic = topic;
        try {
            await apiClient.createVehicle({
                sessionToken,
                coveyTownID: currentTownID,
                conversationArea: conversationToCreate.toServerConversationArea(),
                playerId: playerID,
                vehicleType: 'car'
            });
            toast({
            title: 'Vehicle Created!',
            status: 'success',
            });
            video?.unPauseGame();
            closeModal();
        } catch (err) {
            toast({
            title: 'Unable to create vehicle',
            description: err.toString(),
            status: 'error',
            });
        }
        }
    }, [topic, apiClient, newVehicle, closeModal, currentTownID, sessionToken, toast, video]);
    return (
        <Modal isOpen={isOpen} onClose={()=>{closeModal(); video?.unPauseGame()}}>
        <ModalOverlay />
        <ModalContent>
            <ModalHeader>Create a conversation in {newVehicle.conversationArea.label} </ModalHeader>
            <ModalCloseButton />
            <form
            onSubmit={ev => {
                ev.preventDefault();
                createVehicle();
            }}>
            <ModalBody pb={6}>
                <FormControl>
                <FormLabel htmlFor='topic'>Topic of Conversation</FormLabel>
                <Input
                    id='topic'
                    placeholder='Share the topic of your conversation'
                    name='topic'
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                />
                </FormControl>
            </ModalBody>
            <ModalFooter>
                <Button colorScheme='blue' mr={3} onClick={createVehicle}>
                Create
                </Button>
                <Button onClick={closeModal}>Cancel</Button>
            </ModalFooter>
            </form>
        </ModalContent>
        </Modal>
    );
}
    
    