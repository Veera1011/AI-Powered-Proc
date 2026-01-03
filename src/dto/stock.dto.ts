import { IsString, IsNumber, IsOptional, Min, IsNotEmpty } from 'class-validator';

export class CreateStockDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsNumber()
    @Min(0)
    quantity: number;

    @IsString()
    @IsNotEmpty()
    unit: string;

    @IsNumber()
    @Min(0)
    threshold: number;
}

export class UpdateStockDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsNumber()
    @Min(0)
    @IsOptional()
    quantity?: number;

    @IsString()
    @IsOptional()
    unit?: string;

    @IsNumber()
    @Min(0)
    @IsOptional()
    threshold?: number;
}
