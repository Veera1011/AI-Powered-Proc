import { IsString, IsNumber, IsNotEmpty, Min, IsDateString, IsOptional } from 'class-validator';

export class CreateSalesDto {
    @IsString()
    @IsNotEmpty()
    itemId: string;

    @IsNumber()
    @Min(1)
    quantity: number;

    @IsDateString()
    @IsOptional()
    date?: string;
}
