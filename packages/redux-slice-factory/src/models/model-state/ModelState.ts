import StateStatusEnum from '../../constants/StateStatusEnum';
import MetaState, { IMetaState } from '../meta-state';

export interface IModelState<
    T,
    TStatusEnum extends keyof typeof StateStatusEnum = keyof typeof StateStatusEnum,
    TError extends Error = Error
    > extends IMetaState<TStatusEnum, TError> {
    model: T;
}

const create = <
    T,
    TStatusEnum extends keyof typeof StateStatusEnum = keyof typeof StateStatusEnum,
    TError extends Error = Error
    > (args: Partial<IModelState<T, TStatusEnum, TError>> = {}): IModelState<T, TStatusEnum, TError> => {
    const metaState = MetaState.create(args);
    return {
        ...metaState,
        model: args.model as T
    };
};

const ModelState = {
    create: create
};

export default ModelState;
